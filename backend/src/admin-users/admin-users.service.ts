import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  private userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    accountStatus: true,
    accountReviewNote: true,
    accountReviewedAt: true,
    accountReviewedById: true,
    department: true,
    jobTitle: true,
    phone: true,
    avatarUrl: true,
    bio: true,
    socialLinks: true,
    createdAt: true,
    _count: {
      select: {
        bookings: true,
        ownedProperties: true,
      },
    },
  };

  async findAll(query: any = {}) {
    const where: any = {};

    if (query.role && query.role !== 'ALL') {
      where.role = String(query.role).toUpperCase();
    }

    if (
      query.accountStatus &&
      query.accountStatus !== 'ALL'
    ) {
      where.accountStatus = String(
        query.accountStatus,
      ).toUpperCase();
    }

    if (query.search) {
      const search = String(query.search).trim();

      if (search) {
        where.OR = [
          {
            fullName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }
    }

    return this.prisma.user.findMany({
      where,
      select: this.userSelect,
      orderBy: {
        createdAt: 'desc',
      },
      take: query.take
        ? Math.min(Number(query.take), 200)
        : 200,
    });
  }

  async stats() {
    const users = await this.prisma.user.findMany({
      select: {
        role: true,
        accountStatus: true,
      },
    });

    return users.reduce(
      (summary, user) => {
        summary.total += 1;
        summary.byRole[user.role] =
          (summary.byRole[user.role] || 0) + 1;
        summary.byStatus[user.accountStatus] =
          (summary.byStatus[user.accountStatus] || 0) +
          1;

        if (
          user.role === 'OWNER' &&
          user.accountStatus === 'PENDING'
        ) {
          summary.pendingPartners += 1;
        }

        return summary;
      },
      {
        total: 0,
        pendingPartners: 0,
        byRole: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
      },
    );
  }

  async approve(
    id: number,
    actor: any,
    note?: string,
  ) {
    return this.updateStatus(
      id,
      'APPROVED',
      actor,
      note || 'Approved',
    );
  }

  async reject(
    id: number,
    actor: any,
    note?: string,
  ) {
    const reason = String(note || '').trim();

    if (!reason) {
      throw new BadRequestException(
        'Review note is required',
      );
    }

    return this.updateStatus(
      id,
      'REJECTED',
      actor,
      reason,
    );
  }

  async suspend(
    id: number,
    actor: any,
    note?: string,
  ) {
    const reason =
      String(note || '').trim() || 'Suspended';

    return this.updateStatus(
      id,
      'SUSPENDED',
      actor,
      reason,
    );
  }

  async markPending(
    id: number,
    actor: any,
    note?: string,
  ) {
    return this.updateStatus(
      id,
      'PENDING',
      actor,
      note || 'Moved back to pending review',
    );
  }

  private async updateStatus(
    id: number,
    accountStatus: string,
    actor: any,
    note: string,
  ) {
    const target =
      await this.prisma.user.findUnique({
        where: { id },
      });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (Number(actor?.sub) === target.id) {
      throw new BadRequestException(
        'Cannot review your own account',
      );
    }

    if (
      actor?.role !== 'SUPERADMIN' &&
      ['SUPERADMIN', 'ADMIN', 'FINANCE_HEAD'].includes(
        target.role,
      )
    ) {
      throw new ForbiddenException(
        'Only superadmin can review staff accounts',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        accountStatus: accountStatus as any,
        accountReviewNote:
          String(note || '').trim() || null,
        accountReviewedAt: new Date(),
        accountReviewedById: actor?.sub
          ? Number(actor.sub)
          : null,
      },
      select: this.userSelect,
    });
  }
}
