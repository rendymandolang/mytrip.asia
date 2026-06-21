import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AvailabilityService } from '../availability/availability.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AllotmentsService {
  constructor(
    private prisma: PrismaService,
    private availabilityService: AvailabilityService,
  ) {}

  private allotmentInclude = {
    property: true,
    roomType: true,
  };

  async findAll(filters: any) {
    const where: any = {};

    if (filters.propertyId) {
      where.propertyId = this.toNumber(
        filters.propertyId,
        'propertyId',
      );
    }

    if (filters.roomTypeId) {
      where.roomTypeId = this.toNumber(
        filters.roomTypeId,
        'roomTypeId',
      );
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};

      if (filters.startDate) {
        where.date.gte = this.toDateOnly(
          new Date(filters.startDate),
        );
      }

      if (filters.endDate) {
        where.date.lt = this.toDateOnly(
          new Date(filters.endDate),
        );
      }
    }

    return this.prisma.allotment.findMany({
      where,
      include: this.allotmentInclude,
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

  async upsert(data: any) {
    const allotmentData =
      await this.normalizeAllotmentData(data);

    const allotment =
      await this.prisma.allotment.upsert({
        where: {
          date_roomTypeId: {
            date: allotmentData.date,
            roomTypeId: allotmentData.roomTypeId,
          },
        },
        create: allotmentData,
        update: allotmentData,
        include: this.allotmentInclude,
      });

    await this.syncOneDay(
      allotment.date,
      allotment.roomTypeId,
    );

    return allotment;
  }

  async update(id: number, data: any) {
    const existing =
      await this.prisma.allotment.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Allotment not found',
      );
    }

    const updateData =
      await this.normalizeAllotmentData(
        {
          ...existing,
          ...data,
        },
        true,
      );

    const allotment =
      await this.prisma.allotment.update({
        where: { id },
        data: updateData,
        include: this.allotmentInclude,
      });

    await Promise.all([
      this.syncOneDay(
        existing.date,
        existing.roomTypeId,
      ),
      this.syncOneDay(
        allotment.date,
        allotment.roomTypeId,
      ),
    ]);

    return allotment;
  }

  async remove(id: number) {
    const existing =
      await this.prisma.allotment.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Allotment not found',
      );
    }

    const deleted =
      await this.prisma.allotment.delete({
        where: { id },
      });

    await this.syncOneDay(
      existing.date,
      existing.roomTypeId,
    );

    return deleted;
  }

  private async normalizeAllotmentData(
    data: any,
    partial = false,
  ) {
    const roomTypeId = this.toNumber(
      data.roomTypeId,
      'roomTypeId',
    );

    const roomType =
      await this.prisma.roomType.findUnique({
        where: {
          id: roomTypeId,
        },
      });

    if (!roomType) {
      throw new NotFoundException(
        'Room type not found',
      );
    }

    const date = this.toDateOnly(
      new Date(data.date),
    );

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid date',
      );
    }

    const allotmentData: any = {
      propertyId:
        data.propertyId !== undefined
          ? this.toNumber(
              data.propertyId,
              'propertyId',
            )
          : roomType.propertyId,
      roomTypeId,
      date,
    };

    if (!partial || data.totalRooms !== undefined) {
      allotmentData.totalRooms = this.toNumber(
        data.totalRooms,
        'totalRooms',
      );
    }

    if (data.closed !== undefined) {
      allotmentData.closed = this.toBoolean(
        data.closed,
      );
    }

    if (data.rate !== undefined) {
      allotmentData.rate =
        data.rate === null || data.rate === ''
          ? null
          : data.rate.toString();
    }

    if (data.minStay !== undefined) {
      allotmentData.minStay =
        data.minStay === null ||
        data.minStay === ''
          ? null
          : this.toNumber(
              data.minStay,
              'minStay',
            );
    }

    if (data.maxStay !== undefined) {
      allotmentData.maxStay =
        data.maxStay === null ||
        data.maxStay === ''
          ? null
          : this.toNumber(
              data.maxStay,
              'maxStay',
            );
    }

    return allotmentData;
  }

  private async syncOneDay(
    date: Date,
    roomTypeId: number,
  ) {
    const endDate = new Date(date);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    await this.availabilityService.syncDailyAvailability(
      date,
      endDate,
      [roomTypeId],
    );
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

  private toBoolean(value: any) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return Boolean(value);
  }
}
