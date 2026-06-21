import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomTypesService {
  constructor(private prisma: PrismaService) {}

  private roomTypeInclude = {
    property: true,
    rooms: {
      orderBy: {
        id: 'asc' as const,
      },
    },
    _count: {
      select: {
        rooms: true,
      },
    },
  };

  async findAll(propertyId?: string) {
    const where: any = {};

    if (propertyId) {
      where.propertyId = this.toNumber(
        propertyId,
        'propertyId',
      );
    }

    return this.prisma.roomType.findMany({
      where,
      include: this.roomTypeInclude,
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const roomType =
      await this.prisma.roomType.findUnique({
        where: { id },
        include: this.roomTypeInclude,
      });

    if (!roomType) {
      throw new NotFoundException(
        'Room type not found',
      );
    }

    return roomType;
  }

  async create(data: any) {
    const roomType =
      await this.prisma.roomType.create({
        data: this.normalizeRoomTypeData(data),
        include: this.roomTypeInclude,
      });

    return roomType;
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    return this.prisma.roomType.update({
      where: { id },
      data: this.normalizeRoomTypeData(data, true),
      include: this.roomTypeInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.roomType.delete({
      where: { id },
    });
  }

  async refreshTotalRooms(roomTypeId?: number | null) {
    if (!roomTypeId) {
      return;
    }

    const totalRooms =
      await this.prisma.room.count({
        where: {
          roomTypeId,
        },
      });

    await this.prisma.roomType.update({
      where: {
        id: roomTypeId,
      },
      data: {
        totalRooms,
      },
    });
  }

  private normalizeRoomTypeData(
    data: any,
    partial = false,
  ) {
    const roomTypeData: any = {};

    if (!partial || data.propertyId !== undefined) {
      roomTypeData.propertyId = this.toNumber(
        data.propertyId,
        'propertyId',
      );
    }

    if (!partial || data.name !== undefined) {
      const name = String(data.name || '').trim();

      if (!name) {
        throw new BadRequestException(
          'Room type name is required',
        );
      }

      roomTypeData.name = name;
    }

    if (data.description !== undefined) {
      roomTypeData.description =
        data.description?.trim() || null;
    }

    if (!partial || data.capacity !== undefined) {
      roomTypeData.capacity = this.toNumber(
        data.capacity,
        'capacity',
      );
    }

    if (data.totalRooms !== undefined) {
      roomTypeData.totalRooms = this.toNumber(
        data.totalRooms,
        'totalRooms',
      );
    }

    if (data.basePrice !== undefined) {
      roomTypeData.basePrice =
        data.basePrice === null ||
        data.basePrice === ''
          ? null
          : data.basePrice.toString();
    }

    return roomTypeData;
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
