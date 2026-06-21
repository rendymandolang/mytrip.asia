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

    const nextRoomId = Number(
      bookingData.roomId ?? existing.roomId,
    );

    const nextCheckIn = new Date(
      bookingData.checkIn ?? existing.checkIn,
    );

    const nextCheckOut = new Date(
      bookingData.checkOut ?? existing.checkOut,
    );

    const nextStatus =
      bookingData.status ?? existing.status;

    this.validateDateRange(
      nextCheckIn,
      nextCheckOut,
    );

    if (nextStatus !== 'CANCELLED') {
      const overlappingBooking =
        await this.prisma.booking.findFirst({
          where: {
            id: {
              not: id,
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

    const action = this.getAuditAction(
      existing.status,
      bookingData,
    );

    return this.prisma.$transaction(
      async (tx) => {
        const updated =
          await tx.booking.update({
            where: { id },
            data: bookingData,
            include: this.bookingInclude,
          });

        await tx.bookingAuditLog.create({
          data: {
            bookingId: id,
            actorUserId,
            action,
            reason:
              auditReason || reason || null,
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
}
