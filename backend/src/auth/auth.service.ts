import { Injectable } from '@nestjs/common';
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
    department: true,
    jobTitle: true,
    phone: true,
    avatarUrl: true,
    bio: true,
    socialLinks: true,
    createdAt: true,
  };

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(
      data.password,
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
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: role as any,
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
        fullName: data.fullName,
        department: data.department,
        jobTitle: data.jobTitle,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        socialLinks,
      },
      select: this.profileSelect,
    });
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
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
