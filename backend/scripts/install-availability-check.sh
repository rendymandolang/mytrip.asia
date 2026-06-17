#!/bin/bash

echo "Installing Availability Check into BookingsService..."

cat > src/bookings/bookings.service.ts << 'EOF'
import { Injectable, BadRequestException } from '@nestjs/common';
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
      where: { id },
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

  async update(id: number, data: any) {
    return this.prisma.booking.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.booking.delete({
      where: { id },
    });
  }
}
EOF

echo "Availability Check Installed Successfully"
