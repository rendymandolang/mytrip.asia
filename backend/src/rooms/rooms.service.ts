import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.room.findMany({
      include: {
        property: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });
  }

  async create(data: any) {
    return this.prisma.room.create({
      data,
    });
  }

  async update(id: number, data: any) {
    return this.prisma.room.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.room.delete({
      where: { id },
    });
  }
}
