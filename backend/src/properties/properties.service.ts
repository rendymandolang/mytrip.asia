import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  private propertyInclude = {
    owner: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    },
    reviewedBy: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    },
    destination: true,
    roomTypes: {
      include: {
        rooms: true,
      },
      orderBy: {
        id: 'asc' as const,
      },
    },
    rooms: {
      include: {
        roomType: true,
      },
      orderBy: {
        id: 'asc' as const,
      },
    },
  };

  async findAll() {
    return this.prisma.property.findMany({
      include: this.propertyInclude,
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findReviewRequests(status?: string) {
    const normalizedStatus =
      String(status || 'PENDING_REVIEW')
        .toUpperCase()
        .trim();
    const where: any =
      normalizedStatus === 'ALL'
        ? {}
        : {
            approvalStatus: normalizedStatus,
          };

    return this.prisma.property.findMany({
      where,
      include: this.propertyInclude,
      orderBy: [
        {
          submittedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(id: number) {
    const property =
      await this.prisma.property.findUnique({
      where: { id },
      include: this.propertyInclude,
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return property;
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    return this.prisma.property.update({
      where: { id },
      data: await this.normalizePropertyData(
        data,
        true,
      ),
      include: this.propertyInclude,
    });
  }

  async create(data: any) {
    return this.prisma.property.create({
      data: await this.normalizePropertyData(data),
      include: this.propertyInclude,
    });
  }

  async approve(
    id: number,
    actorUserId?: number,
    reviewNote?: string,
  ) {
    await this.findOne(id);

    return this.prisma.property.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvalNote:
          String(reviewNote || '').trim() || null,
        reviewedAt: new Date(),
        reviewedById: actorUserId || null,
        isPublished: true,
      },
      include: this.propertyInclude,
    });
  }

  async reject(
    id: number,
    actorUserId?: number,
    reviewNote?: string,
  ) {
    await this.findOne(id);

    const note = String(reviewNote || '').trim();

    if (!note) {
      throw new BadRequestException(
        'Review note is required',
      );
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        approvalNote: note,
        reviewedAt: new Date(),
        reviewedById: actorUserId || null,
        isPublished: false,
      },
      include: this.propertyInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.property.delete({
      where: { id },
    });
  }

  private async normalizePropertyData(
    data: any,
    partial = false,
  ) {
    const propertyData: any = {};

    if (!partial || data.name !== undefined) {
      const name = String(data.name || '').trim();

      if (!name) {
        throw new BadRequestException(
          'Property name is required',
        );
      }

      propertyData.name = name;
    }

    if (data.slug !== undefined) {
      propertyData.slug =
        String(data.slug || '').trim() || null;
    }

    if (!partial || data.propertyType !== undefined) {
      propertyData.propertyType =
        data.propertyType || 'HOTEL';
    }

    if (data.supportedRentalTerms !== undefined) {
      propertyData.supportedRentalTerms =
        this.normalizeStringList(
          data.supportedRentalTerms,
        );
    } else if (!partial) {
      propertyData.supportedRentalTerms = ['DAILY'];
    }

    if (data.destinationId !== undefined) {
      propertyData.destinationId =
        data.destinationId === null ||
        data.destinationId === ''
          ? null
          : this.toNumber(
              data.destinationId,
              'destinationId',
            );

      if (propertyData.destinationId) {
        const destination =
          await this.prisma.destination.findUnique({
            where: {
              id: propertyData.destinationId,
            },
          });

        if (!destination) {
          throw new NotFoundException(
            'Destination not found',
          );
        }

        if (!data.city) {
          propertyData.city = destination.city;
        }

        if (!data.country) {
          propertyData.country =
            destination.country;
        }
      }
    }

    if (data.ownerId !== undefined) {
      propertyData.ownerId =
        data.ownerId === null || data.ownerId === ''
          ? null
          : this.toNumber(data.ownerId, 'ownerId');

      if (propertyData.ownerId) {
        const owner = await this.prisma.user.findFirst({
          where: {
            id: propertyData.ownerId,
            role: 'OWNER',
          },
        });

        if (!owner) {
          throw new NotFoundException(
            'Owner user not found',
          );
        }
      }
    }

    for (const field of [
      'description',
      'address',
      'fullAddress',
      'city',
      'country',
      'area',
      'buildingName',
      'additionalInfo',
    ]) {
      if (data[field] !== undefined) {
        propertyData[field] =
          String(data[field] || '').trim() || null;
      }
    }

    if (data.timezone !== undefined) {
      propertyData.timezone =
        String(data.timezone || '').trim() ||
        'Asia/Jakarta';
    }

    if (data.currency !== undefined) {
      propertyData.currency =
        String(data.currency || '').trim() || 'IDR';
    }

    if (data.latitude !== undefined) {
      propertyData.latitude =
        this.optionalDecimal(data.latitude);
    }

    if (data.longitude !== undefined) {
      propertyData.longitude =
        this.optionalDecimal(data.longitude);
    }

    for (const field of [
      'gallery',
      'propertyFacilities',
      'buildingFacilities',
    ]) {
      if (data[field] !== undefined) {
        propertyData[field] =
          this.normalizeJsonList(data[field]);
      }
    }

    if (data.rating !== undefined) {
      propertyData.rating =
        this.optionalDecimal(data.rating) || '0';
    }

    if (data.reviewCount !== undefined) {
      propertyData.reviewCount = this.toNumber(
        data.reviewCount,
        'reviewCount',
      );
    }

    if (data.isPublished !== undefined) {
      propertyData.isPublished =
        this.toBoolean(data.isPublished);
    }

    if (data.approvalStatus !== undefined) {
      propertyData.approvalStatus =
        data.approvalStatus;
    }

    if (data.approvalNote !== undefined) {
      propertyData.approvalNote =
        String(data.approvalNote || '').trim() ||
        null;
    }

    return propertyData;
  }

  private normalizeStringList(value: any) {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  private normalizeJsonList(value: any) {
    if (value === null || value === '') {
      return null;
    }

    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) {
        return null;
      }

      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed
          .split(/\n/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return value;
  }

  private optionalDecimal(value: any) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      throw new BadRequestException(
        'Invalid decimal value',
      );
    }

    return value.toString();
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
