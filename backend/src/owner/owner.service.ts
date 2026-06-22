import {
  BadRequestException,
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

  async createProperty(ownerId: number, data: any) {
    const owner = await this.prisma.user.findFirst({
      where: {
        id: ownerId,
        role: 'OWNER',
        accountStatus: 'APPROVED',
      },
    });

    if (!owner) {
      throw new ForbiddenException(
        'Partner account is not approved',
      );
    }

    const name = String(data.name || '').trim();

    if (!name) {
      throw new BadRequestException(
        'Property name is required',
      );
    }

    const supportedRentalTerms =
      this.normalizeStringList(
        data.supportedRentalTerms,
      );

    const property =
      await this.prisma.property.create({
        data: {
          ownerId,
          name,
          slug:
            String(data.slug || '').trim() ||
            this.slugify(`${name}-${ownerId}-${Date.now()}`),
          propertyType:
            data.propertyType || 'APARTMENT',
          supportedRentalTerms:
            supportedRentalTerms.length > 0
              ? supportedRentalTerms
              : ['DAILY'],
          destinationId:
            data.destinationId === undefined ||
            data.destinationId === null ||
            data.destinationId === ''
              ? null
              : this.toNumber(
                  data.destinationId,
                  'destinationId',
                ),
          city:
            String(data.city || '').trim() || null,
          country:
            String(data.country || '').trim() ||
            'Indonesia',
          area:
            String(data.area || '').trim() || null,
          address:
            String(data.address || '').trim() || null,
          fullAddress:
            String(data.fullAddress || '').trim() ||
            null,
          description:
            String(data.description || '').trim() ||
            null,
          propertyFacilities:
            this.normalizeJsonList(
              data.propertyFacilities,
            ),
          buildingFacilities:
            this.normalizeJsonList(
              data.buildingFacilities,
            ),
          additionalInfo:
            String(data.additionalInfo || '').trim() ||
            null,
          timezone:
            String(data.timezone || '').trim() ||
            'Asia/Jakarta',
          currency:
            String(data.currency || '').trim() || 'IDR',
          approvalStatus: 'DRAFT',
          isPublished: false,
        },
        include: this.include,
      });

    return property;
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

    if (data.name !== undefined) {
      const nextName = String(data.name || '').trim();

      if (!nextName) {
        throw new BadRequestException(
          'Property name is required',
        );
      }

      safeData.name = nextName;
    }

    for (const field of [
      'slug',
      'city',
      'country',
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

    if (data.propertyType !== undefined) {
      safeData.propertyType =
        data.propertyType || 'APARTMENT';
    }

    if (data.supportedRentalTerms !== undefined) {
      const terms = this.normalizeStringList(
        data.supportedRentalTerms,
      );
      safeData.supportedRentalTerms =
        terms.length > 0 ? terms : ['DAILY'];
    }

    if (data.destinationId !== undefined) {
      safeData.destinationId =
        data.destinationId === null ||
        data.destinationId === ''
          ? null
          : this.toNumber(
              data.destinationId,
              'destinationId',
            );
    }

    if (data.latitude !== undefined) {
      safeData.latitude =
        data.latitude === null || data.latitude === ''
          ? null
          : data.latitude.toString();
    }

    if (data.longitude !== undefined) {
      safeData.longitude =
        data.longitude === null ||
        data.longitude === ''
          ? null
          : data.longitude.toString();
    }

    if (data.timezone !== undefined) {
      safeData.timezone =
        String(data.timezone || '').trim() ||
        'Asia/Jakarta';
    }

    if (data.currency !== undefined) {
      safeData.currency =
        String(data.currency || '').trim() || 'IDR';
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

    const submitAfterSave = data.submitAfterSave === true;

    if (
      Object.keys(safeData).length === 0 &&
      !submitAfterSave
    ) {
      throw new BadRequestException(
        'No owner-editable fields provided',
      );
    }

    return this.prisma.property.update({
      where: {
        id: propertyId,
      },
      data: {
        ...safeData,
        ...(submitAfterSave
          ? {
              approvalStatus: 'PENDING_REVIEW',
              submittedAt: new Date(),
              approvalNote: null,
              reviewedAt: null,
              reviewedById: null,
              isPublished: false,
            }
          : {}),
      },
      include: this.include,
    });
  }

  async submitPropertyForReview(
    ownerId: number,
    propertyId: number,
  ) {
    const property = await this.property(
      ownerId,
      propertyId,
    );

    if (!property.name || !property.propertyType) {
      throw new BadRequestException(
        'Property basic information is required',
      );
    }

    if (
      !property.city &&
      !property.country &&
      !property.fullAddress
    ) {
      throw new BadRequestException(
        'Property location information is required',
      );
    }

    return this.prisma.property.update({
      where: {
        id: propertyId,
      },
      data: {
        approvalStatus: 'PENDING_REVIEW',
        submittedAt: new Date(),
        approvalNote: null,
        reviewedAt: null,
        reviewedById: null,
        isPublished: false,
      },
      include: this.include,
    });
  }

  async createRoomType(
    ownerId: number,
    propertyId: number,
    data: any,
  ) {
    await this.property(ownerId, propertyId);

    const name = String(data.name || '').trim();

    if (!name) {
      throw new BadRequestException(
        'Room type name is required',
      );
    }

    return this.prisma.roomType.create({
      data: {
        propertyId,
        name,
        bedroomType: data.bedroomType || null,
        description:
          String(data.description || '').trim() ||
          null,
        capacity: this.toNumber(
          data.capacity || 1,
          'capacity',
        ),
        basePrice:
          data.basePrice === undefined ||
          data.basePrice === null ||
          data.basePrice === ''
            ? null
            : data.basePrice.toString(),
        unitFacilities:
          this.normalizeJsonList(
            data.unitFacilities,
          ),
      },
      include: {
        rooms: true,
        property: true,
      },
    });
  }

  async createRoom(
    ownerId: number,
    propertyId: number,
    data: any,
  ) {
    await this.property(ownerId, propertyId);

    const roomTypeId =
      data.roomTypeId === undefined ||
      data.roomTypeId === null ||
      data.roomTypeId === ''
        ? null
        : this.toNumber(data.roomTypeId, 'roomTypeId');

    if (roomTypeId) {
      const roomType =
        await this.prisma.roomType.findFirst({
          where: {
            id: roomTypeId,
            propertyId,
          },
        });

      if (!roomType) {
        throw new NotFoundException(
          'Room type not found',
        );
      }
    }

    const name = String(data.name || '').trim();

    if (!name) {
      throw new BadRequestException(
        'Room name is required',
      );
    }

    const room = await this.prisma.room.create({
      data: {
        propertyId,
        roomTypeId,
        name,
        description:
          String(data.description || '').trim() ||
          null,
        price:
          data.price === undefined ||
          data.price === null ||
          data.price === ''
            ? '0'
            : data.price.toString(),
        capacity: this.toNumber(
          data.capacity || 1,
          'capacity',
        ),
        tower:
          String(data.tower || '').trim() || null,
        floor:
          String(data.floor || '').trim() || null,
        electricityWatt:
          data.electricityWatt === undefined ||
          data.electricityWatt === null ||
          data.electricityWatt === ''
            ? null
            : this.toNumber(
                data.electricityWatt,
                'electricityWatt',
              ),
        unitFacilities:
          this.normalizeJsonList(
            data.unitFacilities,
          ),
        gallery: this.normalizeJsonList(data.gallery),
        additionalInfo:
          String(data.additionalInfo || '').trim() ||
          null,
      },
      include: {
        property: true,
        roomType: true,
      },
    });

    if (roomTypeId) {
      await this.prisma.roomType.update({
        where: {
          id: roomTypeId,
        },
        data: {
          totalRooms: await this.prisma.room.count({
            where: {
              roomTypeId,
            },
          }),
        },
      });
    }

    return room;
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
      return value
        .split(/\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return value;
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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
