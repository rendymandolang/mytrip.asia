import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomTypesService } from '../room-types/room-types.service';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private roomTypesService: RoomTypesService,
  ) {}

  private roomInclude = {
    property: true,
    roomType: true,
  };

  async findAll() {
    return this.prisma.room.findMany({
      include: this.roomInclude,
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const room =
      await this.prisma.room.findUnique({
      where: { id },
      include: this.roomInclude,
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async create(data: any) {
    const roomData = this.normalizeRoomData(data);

    const room = await this.prisma.room.create({
      data: roomData,
      include: this.roomInclude,
    });

    await this.roomTypesService.refreshTotalRooms(
      room.roomTypeId,
    );

    return room;
  }

  async update(id: number, data: any) {
    const existing = await this.findOne(id);
    const roomData = this.normalizeRoomData(
      data,
      true,
    );

    const room = await this.prisma.room.update({
      where: { id },
      data: roomData,
      include: this.roomInclude,
    });

    await Promise.all([
      this.roomTypesService.refreshTotalRooms(
        existing.roomTypeId,
      ),
      this.roomTypesService.refreshTotalRooms(
        room.roomTypeId,
      ),
    ]);

    return room;
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    const deleted = await this.prisma.room.delete({
      where: { id },
    });

    await this.roomTypesService.refreshTotalRooms(
      existing.roomTypeId,
    );

    return deleted;
  }

  private normalizeRoomData(
    data: any,
    partial = false,
  ) {
    const roomData: any = {};

    if (!partial || data.propertyId !== undefined) {
      roomData.propertyId = this.toNumber(
        data.propertyId,
        'propertyId',
      );
    }

    if (data.roomTypeId !== undefined) {
      roomData.roomTypeId =
        data.roomTypeId === null ||
        data.roomTypeId === ''
          ? null
          : this.toNumber(
              data.roomTypeId,
              'roomTypeId',
            );
    }

    if (!partial || data.name !== undefined) {
      const name = String(data.name || '').trim();

      if (!name) {
        throw new BadRequestException(
          'Room name is required',
        );
      }

      roomData.name = name;
    }

    if (data.description !== undefined) {
      roomData.description =
        data.description?.trim() || null;
    }

    if (!partial || data.price !== undefined) {
      if (
        data.price === undefined ||
        data.price === null ||
        data.price === ''
      ) {
        throw new BadRequestException(
          'Room price is required',
        );
      }

      roomData.price = data.price.toString();
    }

    if (!partial || data.capacity !== undefined) {
      roomData.capacity = this.toNumber(
        data.capacity,
        'capacity',
      );
    }

    if (
      data.housekeepingStatus !== undefined
    ) {
      roomData.housekeepingStatus =
        data.housekeepingStatus;
    }

    return roomData;
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
