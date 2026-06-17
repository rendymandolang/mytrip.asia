import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
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
      },
    });
  }

  async create(data: any) {
    return this.prisma.booking.create({
      data,
    });
  }

  async update(id: number, data: any) {
    return this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.booking.delete({
      where: {
        id,
      },
    });
  }
}
