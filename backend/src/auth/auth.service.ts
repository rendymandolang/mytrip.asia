import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private profileSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    accountStatus: true,
    accountReviewNote: true,
    accountReviewedAt: true,
    department: true,
    jobTitle: true,
    phone: true,
    avatarUrl: true,
    bio: true,
    socialLinks: true,
    createdAt: true,
  };

  async register(data: any) {
    const fullName = String(
      data.fullName || '',
    ).trim();
    const email = String(data.email || '')
      .trim()
      .toLowerCase();
    const password = String(data.password || '');

    if (!fullName) {
      throw new BadRequestException(
        'Full name is required',
      );
    }

    if (!email) {
      throw new BadRequestException(
        'Email is required',
      );
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Email is already registered',
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10,
    );
    const requestedRole = String(
      data.role || 'CUSTOMER',
    ).toUpperCase();
    const role = ['CUSTOMER', 'OWNER'].includes(
      requestedRole,
    )
      ? requestedRole
      : 'CUSTOMER';

    return this.prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: role as any,
        accountStatus:
          role === 'OWNER' ? 'PENDING' : 'APPROVED',
        phone:
          String(data.phone || '').trim() || null,
        department:
          role === 'OWNER' ? 'Partner' : null,
      },
      select: this.profileSelect,
    });
  }

  async profile(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: this.profileSelect,
    });
  }

  async updateProfile(
    userId: number,
    data: any,
  ) {
    const socialLinks =
      data.socialLinks &&
      typeof data.socialLinks === 'object'
        ? data.socialLinks
        : undefined;

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        fullName:
          data.fullName === undefined
            ? undefined
            : String(data.fullName || '').trim(),
        department:
          data.department === undefined
            ? undefined
            : String(data.department || '').trim() ||
              null,
        jobTitle:
          data.jobTitle === undefined
            ? undefined
            : String(data.jobTitle || '').trim() ||
              null,
        phone:
          data.phone === undefined
            ? undefined
            : String(data.phone || '').trim() || null,
        avatarUrl:
          data.avatarUrl === undefined
            ? undefined
            : String(data.avatarUrl || '').trim() ||
              null,
        bio:
          data.bio === undefined
            ? undefined
            : String(data.bio || '').trim() || null,
        socialLinks,
      },
      select: this.profileSelect,
    });
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: String(data.email || '')
          .trim()
          .toLowerCase(),
      },
    });

    if (!user) {
      return {
        message: 'Invalid email or password',
      };
    }

    const validPassword = await bcrypt.compare(
      data.password,
      user.password,
    );

    if (!validPassword) {
      return {
        message: 'Invalid email or password',
      };
    }

    if (
      ['REJECTED', 'SUSPENDED'].includes(
        user.accountStatus,
      )
    ) {
      return {
        message:
          user.accountStatus === 'REJECTED'
            ? 'Account registration was rejected'
            : 'Account is suspended',
      };
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'mytrip-secret',
      {
        expiresIn: '7d',
      },
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        accountReviewNote: user.accountReviewNote,
        accountReviewedAt: user.accountReviewedAt,
        department: user.department,
        jobTitle: user.jobTitle,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        socialLinks: user.socialLinks,
      },
    };
  }
}
