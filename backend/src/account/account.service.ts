import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async bookings(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.booking.findMany({
      where: {
        OR: [
          {
            userId: user.id,
          },
          {
            guest: {
              email: user.email,
            },
          },
        ],
      },
      include: {
        guest: true,
        invoice: {
          include: {
            payments: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        room: {
          include: {
            property: true,
            roomType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
