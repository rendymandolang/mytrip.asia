import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

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
    this.validateDateRange(
      new Date(data.checkIn),
      new Date(data.checkOut),
    );

    const overlappingBooking =
      await this.prisma.booking.findFirst({
        where: {
          roomId: data.roomId,
          status: {
            not: 'CANCELLED',
          },

          AND: [
            {
              checkIn: {
                lt: new Date(data.checkOut),
              },
            },
            {
              checkOut: {
                gt: new Date(data.checkIn),
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

    return this.prisma.booking.create({
      data,
    });
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

    return this.prisma.$transaction(
      async (tx) => {
        const updated =
          await tx.booking.update({
            where: { id },
            data: normalizedBookingData,
            include: this.bookingInclude,
          });

        await tx.bookingAuditLog.create({
          data: {
            bookingId: id,
            actorUserId,
            action,
            reason: auditReasonText,
            oldData:
              this.serializeBooking(existing),
            newData:
              this.serializeBooking(updated),
          },
        });

        return updated;
      },
    );
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
    return this.prisma.bookingChangeRequest.findMany({
      where: {
        status: 'PENDING',
      },
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

    return this.prisma.$transaction(
      async (tx) => {
        const updatedBooking =
          await tx.booking.update({
            where: {
              id: changeRequest.bookingId,
            },
            data: bookingData,
            include: this.bookingInclude,
          });

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

        return reviewedRequest;
      },
    );
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
    return this.prisma.booking.delete({
      where: { id },
    });
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
  }

  private normalizeBookingData(data: any) {
    const bookingData: any = {};

    if (data.userId !== undefined) {
      bookingData.userId = Number(data.userId);
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

    for (const field of [
      'userId',
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
