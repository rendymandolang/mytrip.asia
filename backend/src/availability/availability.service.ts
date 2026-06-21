import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async calendar(filters: any) {
    const { startDate, endDate } =
      this.resolveDateRange(
        filters.startDate,
        filters.endDate,
      );

    const roomWhere: any = {};

    if (filters.propertyId) {
      roomWhere.propertyId = this.toNumber(
        filters.propertyId,
        'propertyId',
      );
    }

    if (filters.roomId) {
      roomWhere.id = this.toNumber(
        filters.roomId,
        'roomId',
      );
    }

    return this.prisma.room.findMany({
      where: roomWhere,
      include: {
        property: true,
        roomType: true,
        roomAllocations: {
          where: {
            date: {
              gte: this.toDateOnly(startDate),
              lt: this.toDateOnly(endDate),
            },
          },
          include: {
            booking: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
        bookings: {
          where: {
            status: {
              not: 'CANCELLED',
            },
            checkIn: {
              lt: endDate,
            },
            checkOut: {
              gt: startDate,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            checkIn: 'asc',
          },
        },
        availabilityBlocks: {
          where: {
            startDate: {
              lt: endDate,
            },
            endDate: {
              gt: startDate,
            },
          },
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findBlocks(filters: any) {
    const { startDate, endDate } =
      this.resolveDateRange(
        filters.startDate,
        filters.endDate,
      );

    const where: any = {
      startDate: {
        lt: endDate,
      },
      endDate: {
        gt: startDate,
      },
    };

    if (filters.roomId) {
      where.roomId = this.toNumber(
        filters.roomId,
        'roomId',
      );
    }

    return this.prisma.availabilityBlock.findMany({
      where,
      include: {
        room: {
          include: {
            property: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async dailyAvailability(filters: any) {
    const { startDate, endDate } =
      this.resolveDateRange(
        filters.startDate,
        filters.endDate,
      );

    const roomTypeIds = filters.roomTypeId
      ? [
          this.toNumber(
            filters.roomTypeId,
            'roomTypeId',
          ),
        ]
      : undefined;

    await this.syncDailyAvailability(
      startDate,
      endDate,
      roomTypeIds,
    );

    const where: any = {
      date: {
        gte: this.toDateOnly(startDate),
        lt: this.toDateOnly(endDate),
      },
    };

    if (filters.roomTypeId) {
      where.roomTypeId = this.toNumber(
        filters.roomTypeId,
        'roomTypeId',
      );
    }

    if (filters.propertyId) {
      where.roomType = {
        propertyId: this.toNumber(
          filters.propertyId,
          'propertyId',
        ),
      };
    }

    return this.prisma.dailyAvailability.findMany({
      where,
      include: {
        roomType: {
          include: {
            property: true,
          },
        },
      },
      orderBy: [
        {
          date: 'asc',
        },
        {
          roomTypeId: 'asc',
        },
      ],
    });
  }

  async syncDailyAvailability(
    startDate: Date,
    endDate: Date,
    roomTypeIds?: number[],
  ) {
    const dateValues = this.getDateValues(
      startDate,
      endDate,
    );

    if (dateValues.length === 0) {
      return;
    }

    const roomTypes =
      await this.prisma.roomType.findMany({
        where: roomTypeIds?.length
          ? {
              id: {
                in: roomTypeIds,
              },
            }
          : {},
        include: {
          rooms: {
            select: {
              id: true,
            },
          },
        },
      });

    for (const roomType of roomTypes) {
      const physicalRooms =
        roomType.totalRooms ||
        roomType.rooms.length;

      for (const date of dateValues) {
        const nextDate = new Date(date);
        nextDate.setUTCDate(
          nextDate.getUTCDate() + 1,
        );

        const allotment =
          await this.prisma.allotment.findUnique({
            where: {
              date_roomTypeId: {
                date,
                roomTypeId: roomType.id,
              },
            },
          });

        const totalRooms = allotment
          ? allotment.closed
            ? 0
            : allotment.totalRooms
          : physicalRooms;

        const bookedRooms =
          await this.prisma.roomAllocation.count({
            where: {
              date,
              room: {
                roomTypeId: roomType.id,
              },
            },
          });

        const blockedRooms =
          await this.prisma.availabilityBlock.count({
            where: {
              room: {
                roomTypeId: roomType.id,
              },
              startDate: {
                lt: nextDate,
              },
              endDate: {
                gt: date,
              },
            },
          });

        const availableRooms = Math.max(
          totalRooms -
            bookedRooms -
            blockedRooms,
          0,
        );

        await this.prisma.dailyAvailability.upsert({
          where: {
            date_roomTypeId: {
              date,
              roomTypeId: roomType.id,
            },
          },
          create: {
            date,
            roomTypeId: roomType.id,
            totalRooms,
            bookedRooms,
            blockedRooms,
            availableRooms,
          },
          update: {
            totalRooms,
            bookedRooms,
            blockedRooms,
            availableRooms,
          },
        });
      }
    }
  }

  async createBlock(
    data: any,
    actorUserId?: number,
  ) {
    const roomId = this.toNumber(
      data.roomId,
      'roomId',
    );

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    this.validateDateRange(startDate, endDate);

    const room = await this.prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const overlappingBooking =
      await this.prisma.booking.findFirst({
        where: {
          roomId,
          status: {
            not: 'CANCELLED',
          },
          checkIn: {
            lt: endDate,
          },
          checkOut: {
            gt: startDate,
          },
        },
      });

    if (overlappingBooking) {
      throw new BadRequestException(
        'Cannot block dates with active booking',
      );
    }

    const overlappingBlock =
      await this.prisma.availabilityBlock.findFirst({
        where: {
          roomId,
          startDate: {
            lt: endDate,
          },
          endDate: {
            gt: startDate,
          },
        },
      });

    if (overlappingBlock) {
      throw new BadRequestException(
        'Room already has a block in selected dates',
      );
    }

    const block =
      await this.prisma.availabilityBlock.create({
        data: {
          roomId,
          startDate,
          endDate,
          type: data.type || 'OTHER',
          reason: data.reason || null,
          createdById: actorUserId,
        },
        include: {
          room: {
            include: {
              property: true,
              roomType: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      });

    if (room.roomTypeId) {
      await this.syncDailyAvailability(
        startDate,
        endDate,
        [room.roomTypeId],
      );
    }

    return block;
  }

  async removeBlock(id: number) {
    const block =
      await this.prisma.availabilityBlock.findUnique({
        where: { id },
      });

    if (!block) {
      throw new NotFoundException(
        'Availability block not found',
      );
    }

    const deleted =
      await this.prisma.availabilityBlock.delete({
      where: { id },
    });

    const room = await this.prisma.room.findUnique({
      where: {
        id: block.roomId,
      },
    });

    if (room?.roomTypeId) {
      await this.syncDailyAvailability(
        block.startDate,
        block.endDate,
        [room.roomTypeId],
      );
    }

    return deleted;
  }

  private resolveDateRange(
    startDateValue?: string,
    endDateValue?: string,
  ) {
    const now = new Date();

    const startDate = startDateValue
      ? new Date(startDateValue)
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );

    const endDate = endDateValue
      ? new Date(endDateValue)
      : new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1,
        );

    this.validateDateRange(startDate, endDate);

    return {
      startDate,
      endDate,
    };
  }

  private getDateValues(
    startDate: Date,
    endDate: Date,
  ) {
    const values: Date[] = [];
    const cursor = this.toDateOnly(startDate);
    const end = this.toDateOnly(endDate);

    while (cursor < end) {
      values.push(new Date(cursor));
      cursor.setUTCDate(
        cursor.getUTCDate() + 1,
      );
    }

    return values;
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

  private toNumber(value: any, field: string) {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      throw new BadRequestException(
        `Invalid ${field}`,
      );
    }

    return numberValue;
  }

  private validateDateRange(
    startDate: Date,
    endDate: Date,
  ) {
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      throw new BadRequestException(
        'Invalid date range',
      );
    }

    if (endDate <= startDate) {
      throw new BadRequestException(
        'End date must be after start date',
      );
    }
  }
}
