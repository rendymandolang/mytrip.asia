import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private availabilityService: AvailabilityService,
  ) {}

  private bookingInclude = {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    },
    guest: {
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        country: true,
      },
    },
    room: {
      include: {
        property: true,
      },
    },
  };

  async findAll() {
    return this.prisma.booking.findMany({
      include: this.bookingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: this.bookingInclude,
    });
  }

  async create(data: any) {
    const bookingData =
      this.normalizeBookingData(data);

    await this.validateBookingAvailability(
      0,
      bookingData,
      bookingData,
    );

    const created =
      await this.prisma.$transaction(
        async (tx) => {
          const booking =
            await tx.booking.create({
              data: bookingData,
              include: this.bookingInclude,
            });

          await this.replaceRoomAllocations(
            tx,
            booking,
          );

          return booking;
        },
      );

    await this.syncDailyAvailabilityForBookings([
      created,
    ]);

    return created;
  }

  async update(
    id: number,
    data: any,
    actorUserId?: number,
  ) {
    const existing =
      await this.prisma.booking.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const {
      auditReason,
      reason,
      ...bookingData
    } = data;

    const normalizedBookingData =
      this.normalizeBookingData(bookingData);

    if (
      Object.keys(normalizedBookingData)
        .length === 0
    ) {
      throw new BadRequestException(
        'No booking changes provided',
      );
    }

    const changedFields = Object.keys(
      normalizedBookingData,
    );

    if (
      changedFields.length !== 1 ||
      changedFields[0] !== 'status'
    ) {
      throw new BadRequestException(
        'Booking corrections must use approval workflow',
      );
    }

    const auditReasonText = String(
      auditReason || reason || '',
    ).trim();

    if (!auditReasonText) {
      throw new BadRequestException(
        'Audit reason is required',
      );
    }

    await this.validateBookingAvailability(
      id,
      existing,
      normalizedBookingData,
    );

    const action = this.getAuditAction(
      existing.status,
      normalizedBookingData,
    );

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const booking =
            await tx.booking.update({
              where: { id },
              data: normalizedBookingData,
              include: this.bookingInclude,
            });

          await this.replaceRoomAllocations(
            tx,
            booking,
          );

          await tx.bookingAuditLog.create({
            data: {
              bookingId: id,
              actorUserId,
              action,
              reason: auditReasonText,
              oldData:
                this.serializeBooking(existing),
              newData:
                this.serializeBooking(booking),
            },
          });

          await this.queueBookingSyncEvent(
            tx,
            booking,
            action,
          );

          return booking;
        },
      );

    await this.syncDailyAvailabilityForBookings([
      existing,
      updated,
    ]);

    return updated;
  }

  async createChangeRequest(
    id: number,
    data: any,
    actorUserId?: number,
  ) {
    const existing =
      await this.prisma.booking.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const {
      auditReason,
      reason,
      ...bookingData
    } = data;

    const normalizedBookingData =
      this.normalizeBookingData(bookingData);

    if (
      Object.keys(normalizedBookingData)
        .length === 0
    ) {
      throw new BadRequestException(
        'No booking changes provided',
      );
    }

    const requestReason = String(
      auditReason || reason || '',
    ).trim();

    if (!requestReason) {
      throw new BadRequestException(
        'Approval reason is required',
      );
    }

    const pendingRequest =
      await this.prisma.bookingChangeRequest.findFirst(
        {
          where: {
            bookingId: id,
            status: 'PENDING',
          },
        },
      );

    if (pendingRequest) {
      throw new BadRequestException(
        'Booking already has a pending change request',
      );
    }

    await this.validateBookingAvailability(
      id,
      existing,
      normalizedBookingData,
    );

    const action = this.getAuditAction(
      existing.status,
      normalizedBookingData,
    );

    return this.prisma.bookingChangeRequest.create({
      data: {
        bookingId: id,
        requestedById: actorUserId,
        action,
        reason: requestReason,
        oldData:
          this.serializeBooking(existing),
        newData:
          this.serializeBooking({
            ...existing,
            ...normalizedBookingData,
          }),
      },
      include: this.changeRequestInclude(),
    });
  }

  async findPendingChangeRequests() {
    return this.findChangeRequests('PENDING');
  }

  async findChangeRequests(status?: string) {
    const normalizedStatus =
      status?.toUpperCase();

    if (
      normalizedStatus &&
      ![
        'PENDING',
        'APPROVED',
        'REJECTED',
        'ALL',
      ].includes(normalizedStatus)
    ) {
      throw new BadRequestException(
        'Invalid approval status filter',
      );
    }

    const where =
      normalizedStatus &&
      normalizedStatus !== 'ALL'
        ? {
            status: normalizedStatus as any,
          }
        : {};

    return this.prisma.bookingChangeRequest.findMany({
      where,
      include: this.changeRequestInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approveChangeRequest(
    requestId: number,
    actorUserId?: number,
    reviewNote?: string,
  ) {
    const changeRequest =
      await this.prisma.bookingChangeRequest.findUnique(
        {
          where: { id: requestId },
          include: {
            booking: true,
          },
        },
      );

    if (!changeRequest) {
      throw new NotFoundException(
        'Booking change request not found',
      );
    }

    if (changeRequest.status !== 'PENDING') {
      throw new BadRequestException(
        'Booking change request already reviewed',
      );
    }

    if (
      actorUserId &&
      changeRequest.requestedById === actorUserId
    ) {
      throw new BadRequestException(
        'Requester cannot approve their own booking change request',
      );
    }

    const bookingData =
      this.normalizeBookingData(
        changeRequest.newData,
      );

    await this.validateBookingAvailability(
      changeRequest.bookingId,
      changeRequest.booking,
      bookingData,
    );

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const updatedBooking =
            await tx.booking.update({
              where: {
                id: changeRequest.bookingId,
              },
              data: bookingData,
              include: this.bookingInclude,
            });

          await this.replaceRoomAllocations(
            tx,
            updatedBooking,
          );

          const reviewedRequest =
            await tx.bookingChangeRequest.update({
              where: { id: requestId },
              data: {
                status: 'APPROVED',
                reviewedById: actorUserId,
                reviewNote:
                  reviewNote?.trim() || null,
                reviewedAt: new Date(),
              },
              include: this.changeRequestInclude(),
            });

          await tx.bookingAuditLog.create({
            data: {
              bookingId:
                changeRequest.bookingId,
              actorUserId,
              action:
                'BOOKING_CHANGE_APPROVED',
              reason:
                reviewNote?.trim() ||
                changeRequest.reason,
              oldData:
                this.serializeBooking(
                  changeRequest.booking,
                ),
              newData:
                this.serializeBooking(
                  updatedBooking,
                ),
            },
          });

          await this.queueBookingSyncEvent(
            tx,
            updatedBooking,
            'BOOKING_CHANGE_APPROVED',
          );

          return {
            reviewedRequest,
            updatedBooking,
          };
        },
      );

    await this.syncDailyAvailabilityForBookings([
      changeRequest.booking,
      result.updatedBooking,
    ]);

    return result.reviewedRequest;
  }

  async rejectChangeRequest(
    requestId: number,
    actorUserId?: number,
    reviewNote?: string,
  ) {
    const changeRequest =
      await this.prisma.bookingChangeRequest.findUnique(
        {
          where: { id: requestId },
        },
      );

    if (!changeRequest) {
      throw new NotFoundException(
        'Booking change request not found',
      );
    }

    if (changeRequest.status !== 'PENDING') {
      throw new BadRequestException(
        'Booking change request already reviewed',
      );
    }

    if (
      actorUserId &&
      changeRequest.requestedById === actorUserId
    ) {
      throw new BadRequestException(
        'Requester cannot reject their own booking change request',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const reviewedRequest =
          await tx.bookingChangeRequest.update({
            where: { id: requestId },
            data: {
              status: 'REJECTED',
              reviewedById: actorUserId,
              reviewNote:
                reviewNote?.trim() || null,
              reviewedAt: new Date(),
            },
            include: this.changeRequestInclude(),
          });

        await tx.bookingAuditLog.create({
          data: {
            bookingId:
              changeRequest.bookingId,
            actorUserId,
            action:
              'BOOKING_CHANGE_REJECTED',
            reason:
              reviewNote?.trim() ||
              changeRequest.reason,
            oldData:
              (changeRequest.oldData ??
                undefined) as any,
            newData:
              changeRequest.newData as any,
          },
        });

        return reviewedRequest;
      },
    );
  }

  async findAuditLogs(bookingId: number) {
    return this.prisma.bookingAuditLog.findMany({
      where: { bookingId },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(id: number) {
    const existing =
      await this.prisma.booking.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const deleted =
      await this.prisma.booking.delete({
      where: { id },
    });

    await this.syncDailyAvailabilityForBookings([
      existing,
    ]);

    return deleted;
  }

  private async replaceRoomAllocations(
    tx: any,
    booking: any,
  ) {
    await tx.roomAllocation.deleteMany({
      where: {
        bookingId: booking.id,
      },
    });

    if (booking.status === 'CANCELLED') {
      return;
    }

    const dates = this.getNightDates(
      booking.checkIn,
      booking.checkOut,
    );

    if (dates.length === 0) {
      return;
    }

    await tx.roomAllocation.createMany({
      data: dates.map((date) => ({
        bookingId: booking.id,
        roomId: booking.roomId,
        date,
      })),
    });
  }

  private async queueBookingSyncEvent(
    tx: any,
    booking: any,
    action: string,
  ) {
    const propertyId =
      booking.room?.propertyId ||
      booking.room?.property?.id;

    if (!propertyId) {
      return;
    }

    await tx.channelSyncEvent.create({
      data: {
        propertyId,
        bookingId: booking.id,
        direction: 'OUTBOUND',
        eventType:
          booking.status === 'CANCELLED'
            ? 'BOOKING_CANCELLED'
            : 'BOOKING_UPDATED',
        payload: {
          bookingId: booking.id,
          action,
          roomId: booking.roomId,
          checkIn:
            booking.checkIn instanceof Date
              ? booking.checkIn.toISOString()
              : booking.checkIn,
          checkOut:
            booking.checkOut instanceof Date
              ? booking.checkOut.toISOString()
              : booking.checkOut,
          status: booking.status,
        },
      },
    });
  }

  private async syncDailyAvailabilityForBookings(
    bookings: any[],
  ) {
    const roomTypeIds = new Set<number>();
    const dateValues: number[] = [];

    for (const booking of bookings) {
      if (!booking) {
        continue;
      }

      const room = await this.prisma.room.findUnique({
        where: {
          id: booking.roomId,
        },
        select: {
          roomTypeId: true,
        },
      });

      if (room?.roomTypeId) {
        roomTypeIds.add(room.roomTypeId);
      }

      dateValues.push(
        this.toDateOnly(
          new Date(booking.checkIn),
        ).getTime(),
        this.toDateOnly(
          new Date(booking.checkOut),
        ).getTime(),
      );
    }

    if (
      roomTypeIds.size === 0 ||
      dateValues.length === 0
    ) {
      return;
    }

    await this.availabilityService.syncDailyAvailability(
      new Date(Math.min(...dateValues)),
      new Date(Math.max(...dateValues)),
      [...roomTypeIds],
    );
  }

  private getNightDates(
    checkIn: Date,
    checkOut: Date,
  ) {
    const dates: Date[] = [];
    const cursor = this.toDateOnly(
      new Date(checkIn),
    );
    const end = this.toDateOnly(
      new Date(checkOut),
    );

    while (cursor < end) {
      dates.push(new Date(cursor));
      cursor.setUTCDate(
        cursor.getUTCDate() + 1,
      );
    }

    return dates;
  }

  private toDateOnly(value: Date) {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
      ),
    );
  }

  private validateDateRange(
    checkIn: Date,
    checkOut: Date,
  ) {
    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime())
    ) {
      throw new BadRequestException(
        'Invalid booking dates',
      );
    }

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'Check-out must be after check-in',
      );
    }
  }

  private async validateBookingAvailability(
    bookingId: number,
    existingBooking: any,
    bookingData: any,
  ) {
    const nextRoomId = Number(
      bookingData.roomId ??
        existingBooking.roomId,
    );

    if (Number.isNaN(nextRoomId)) {
      throw new BadRequestException(
        'Invalid roomId',
      );
    }

    const nextCheckIn = new Date(
      bookingData.checkIn ??
        existingBooking.checkIn,
    );

    const nextCheckOut = new Date(
      bookingData.checkOut ??
        existingBooking.checkOut,
    );

    const nextStatus =
      bookingData.status ??
      existingBooking.status;

    this.validateDateRange(
      nextCheckIn,
      nextCheckOut,
    );

    if (nextStatus === 'CANCELLED') {
      return;
    }

    const overlappingBooking =
      await this.prisma.booking.findFirst({
        where: {
          id: {
            not: bookingId,
          },
          roomId: nextRoomId,
          status: {
            not: 'CANCELLED',
          },
          AND: [
            {
              checkIn: {
                lt: nextCheckOut,
              },
            },
            {
              checkOut: {
                gt: nextCheckIn,
              },
            },
          ],
        },
      });

    if (overlappingBooking) {
      throw new BadRequestException(
        'Room is not available for selected dates',
      );
    }

    const overlappingBlock =
      await this.prisma.availabilityBlock.findFirst({
        where: {
          roomId: nextRoomId,
          startDate: {
            lt: nextCheckOut,
          },
          endDate: {
            gt: nextCheckIn,
          },
        },
      });

    if (overlappingBlock) {
      throw new BadRequestException(
        'Room is blocked for selected dates',
      );
    }
  }

  private normalizeBookingData(data: any) {
    const bookingData: any = {};

    if (data.userId !== undefined) {
      bookingData.userId =
        data.userId === null || data.userId === ''
          ? null
          : Number(data.userId);
    }

    if (data.guestId !== undefined) {
      bookingData.guestId =
        data.guestId === null || data.guestId === ''
          ? null
          : Number(data.guestId);
    }

    if (data.roomId !== undefined) {
      bookingData.roomId = Number(data.roomId);
    }

    if (data.checkIn !== undefined) {
      bookingData.checkIn = new Date(
        data.checkIn,
      );
    }

    if (data.checkOut !== undefined) {
      bookingData.checkOut = new Date(
        data.checkOut,
      );
    }

    if (data.totalAmount !== undefined) {
      bookingData.totalAmount =
        data.totalAmount.toString();
    }

    if (data.status !== undefined) {
      bookingData.status = data.status;
    }

    if (data.rentalTerm !== undefined) {
      bookingData.rentalTerm = data.rentalTerm;
    }

    if (data.pricingSnapshot !== undefined) {
      bookingData.pricingSnapshot =
        data.pricingSnapshot;
    }

    if (data.source !== undefined) {
      bookingData.source =
        data.source?.toString() || null;
    }

    for (const field of [
      'userId',
      'guestId',
      'roomId',
    ]) {
      if (
        bookingData[field] !== undefined &&
        Number.isNaN(bookingData[field])
      ) {
        throw new BadRequestException(
          `Invalid ${field}`,
        );
      }
    }

    return bookingData;
  }

  private getAuditAction(
    previousStatus: string,
    bookingData: any,
  ) {
    const changedFields =
      Object.keys(bookingData);

    if (
      changedFields.length === 1 &&
      changedFields[0] === 'status'
    ) {
      return `STATUS_${previousStatus}_TO_${bookingData.status}`;
    }

    if (
      bookingData.status &&
      bookingData.status !== previousStatus
    ) {
      return 'BOOKING_EDIT_WITH_STATUS_CHANGE';
    }

    return 'BOOKING_EDIT';
  }

  private serializeBooking(booking: any) {
    return {
      id: booking.id,
      userId: booking.userId,
      guestId: booking.guestId,
      roomId: booking.roomId,
      checkIn:
        booking.checkIn instanceof Date
          ? booking.checkIn.toISOString()
          : booking.checkIn,
      checkOut:
        booking.checkOut instanceof Date
          ? booking.checkOut.toISOString()
          : booking.checkOut,
      totalAmount:
        booking.totalAmount?.toString(),
      rentalTerm: booking.rentalTerm,
      pricingSnapshot: booking.pricingSnapshot,
      source: booking.source,
      status: booking.status,
    };
  }

  private changeRequestInclude() {
    return {
      booking: {
        include: this.bookingInclude,
      },
      requestedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    };
  }
}
