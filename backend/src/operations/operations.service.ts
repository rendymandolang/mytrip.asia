import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  private bookingInclude = {
    guest: true,
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    },
    invoice: true,
    room: {
      include: {
        property: true,
        roomType: true,
      },
    },
  };

  async bookings(query: any = {}) {
    const now = new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7,
        );
    const endDate = query.endDate
      ? new Date(query.endDate)
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 30,
        );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      throw new BadRequestException(
        'Invalid date range',
      );
    }

    const where: any = {
      status: {
        not: 'CANCELLED',
      },
      checkIn: {
        lt: endDate,
      },
      checkOut: {
        gt: startDate,
      },
    };

    if (query.propertyId) {
      where.room = {
        propertyId: this.toNumber(
          query.propertyId,
          'propertyId',
        ),
      };
    }

    return this.prisma.booking.findMany({
      where,
      include: this.bookingInclude,
      orderBy: [
        {
          checkIn: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });
  }

  async housekeeping(query: any = {}) {
    const where: any = {};

    if (query.propertyId) {
      where.propertyId = this.toNumber(
        query.propertyId,
        'propertyId',
      );
    }

    if (query.status && query.status !== 'ALL') {
      where.housekeepingStatus = String(
        query.status,
      ).toUpperCase();
    }

    return this.prisma.room.findMany({
      where,
      include: {
        property: true,
        roomType: true,
      },
      orderBy: [
        {
          propertyId: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });
  }

  async updateHousekeeping(
    roomId: number,
    data: any,
  ) {
    const status = String(
      data.housekeepingStatus || data.status || '',
    ).toUpperCase();

    if (
      ![
        'CLEAN',
        'DIRTY',
        'INSPECTING',
        'OUT_OF_SERVICE',
      ].includes(status)
    ) {
      throw new BadRequestException(
        'Invalid housekeeping status',
      );
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        housekeepingStatus: status as any,
      },
      include: {
        property: true,
        roomType: true,
      },
    });
  }

  async checkIn(
    bookingId: number,
    actorUserId?: number,
  ) {
    const existing =
      await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          room: true,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    if (existing.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cancelled booking cannot be checked in',
      );
    }

    const checkedInAt =
      existing.checkedInAt || new Date();

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const booking =
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: 'CONFIRMED',
                checkedInAt,
              },
              include: this.bookingInclude,
            });

          await tx.bookingAuditLog.create({
            data: {
              bookingId,
              actorUserId,
              action: 'CHECK_IN',
              reason: 'Guest checked in',
              oldData:
                this.serializeBooking(existing),
              newData:
                this.serializeBooking(booking),
            },
          });

          return booking;
        },
      );

    return updated;
  }

  async checkOut(
    bookingId: number,
    actorUserId?: number,
  ) {
    const existing =
      await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          room: true,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    if (existing.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cancelled booking cannot be checked out',
      );
    }

    const checkedOutAt =
      existing.checkedOutAt || new Date();

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const booking =
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: 'COMPLETED',
                checkedOutAt,
              },
              include: this.bookingInclude,
            });

          await tx.room.update({
            where: {
              id: existing.roomId,
            },
            data: {
              housekeepingStatus: 'DIRTY',
            },
          });

          await tx.bookingAuditLog.create({
            data: {
              bookingId,
              actorUserId,
              action: 'CHECK_OUT',
              reason:
                'Guest checked out and room marked dirty',
              oldData:
                this.serializeBooking(existing),
              newData:
                this.serializeBooking(booking),
            },
          });

          if (existing.room.propertyId) {
            await tx.channelSyncEvent.create({
              data: {
                propertyId:
                  existing.room.propertyId,
                bookingId,
                direction: 'OUTBOUND',
                eventType: 'BOOKING_UPDATED',
                payload: {
                  bookingId,
                  action: 'CHECK_OUT',
                  housekeepingStatus: 'DIRTY',
                },
              },
            });
          }

          return booking;
        },
      );

    return updated;
  }

  private serializeBooking(booking: any) {
    return {
      id: booking.id,
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
      checkedInAt:
        booking.checkedInAt instanceof Date
          ? booking.checkedInAt.toISOString()
          : booking.checkedInAt,
      checkedOutAt:
        booking.checkedOutAt instanceof Date
          ? booking.checkedOutAt.toISOString()
          : booking.checkedOutAt,
    };
  }

  private toNumber(value: any, field: string) {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      throw new BadRequestException(
        `Invalid ${field}`,
      );
    }

    return numberValue;
  }
}
