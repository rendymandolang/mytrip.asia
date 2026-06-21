import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) {}

  private include = {
    destination: true,
    roomTypes: {
      include: {
        pricingRules: true,
        mediaAssets: true,
        rooms: true,
      },
    },
    rooms: {
      include: {
        roomType: true,
        mediaAssets: true,
      },
    },
    pricingRules: {
      include: {
        roomType: true,
      },
    },
    mediaAssets: true,
  };

  async properties(ownerId: number) {
    return this.prisma.property.findMany({
      where: {
        ownerId,
      },
      include: this.include,
      orderBy: {
        id: 'desc',
      },
    });
  }

  async property(ownerId: number, propertyId: number) {
    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId,
        },
        include: this.include,
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return property;
  }

  async updateProperty(
    ownerId: number,
    propertyId: number,
    data: any,
  ) {
    await this.property(ownerId, propertyId);

    const safeData: any = {};

    for (const field of [
      'description',
      'address',
      'fullAddress',
      'area',
      'buildingName',
      'additionalInfo',
    ]) {
      if (data[field] !== undefined) {
        safeData[field] =
          String(data[field] || '').trim() || null;
      }
    }

    for (const field of [
      'gallery',
      'propertyFacilities',
      'buildingFacilities',
    ]) {
      if (data[field] !== undefined) {
        safeData[field] = Array.isArray(data[field])
          ? data[field].filter(Boolean)
          : data[field];
      }
    }

    if (Object.keys(safeData).length === 0) {
      throw new ForbiddenException(
        'No owner-editable fields provided',
      );
    }

    return this.prisma.property.update({
      where: {
        id: propertyId,
      },
      data: safeData,
      include: this.include,
    });
  }
}
