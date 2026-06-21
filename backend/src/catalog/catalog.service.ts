import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  private propertyInclude = {
    destination: true,
    roomTypes: {
      include: {
        rooms: true,
      },
      orderBy: {
        basePrice: 'asc' as const,
      },
    },
    rooms: {
      include: {
        roomType: true,
      },
      orderBy: {
        price: 'asc' as const,
      },
    },
  };

  async destinations() {
    return this.prisma.destination.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          country: 'asc',
        },
        {
          city: 'asc',
        },
      ],
    });
  }

  async properties(query: any) {
    const where: any = {
      isPublished: true,
    };

    if (query.destinationId) {
      where.destinationId = this.toNumber(
        query.destinationId,
        'destinationId',
      );
    }

    if (query.destination) {
      where.destination = {
        slug: query.destination,
      };
    }

    if (query.country) {
      where.country = {
        equals: query.country,
        mode: 'insensitive',
      };
    }

    if (query.city) {
      where.city = {
        equals: query.city,
        mode: 'insensitive',
      };
    }

    if (query.propertyType) {
      where.propertyType = query.propertyType;
    }

    if (query.rentalTerm) {
      where.supportedRentalTerms = {
        has: query.rentalTerm,
      };
    }

    if (query.bedroomType) {
      where.roomTypes = {
        some: {
          bedroomType: query.bedroomType,
        },
      };
    }

    if (query.q) {
      where.OR = [
        {
          name: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          area: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          city: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          country: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const properties =
      await this.prisma.property.findMany({
        where,
        include: this.propertyInclude,
        orderBy: {
          createdAt: 'desc',
        },
      });

    return this.sortProperties(
      properties.map((property) =>
        this.formatProperty(property),
      ),
      query.sort,
    );
  }

  async propertyDetail(identifier: string) {
    const numericId = Number(identifier);

    const where = Number.isNaN(numericId)
      ? {
          slug: identifier,
        }
      : {
          id: numericId,
        };

    const property =
      await this.prisma.property.findFirst({
        where: {
          ...where,
          isPublished: true,
        },
        include: this.propertyInclude,
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return this.formatProperty(property, true);
  }

  private formatProperty(
    property: any,
    detail = false,
  ) {
    const rooms = property.rooms || [];
    const roomTypes = property.roomTypes || [];
    const prices = rooms
      .map((room: any) => Number(room.price || 0))
      .filter((price: number) => price > 0);

    const minPrice =
      prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice =
      prices.length > 0 ? Math.max(...prices) : null;

    const images = this.asArray(property.gallery);
    const firstRoomImage = rooms
      .flatMap((room: any) =>
        this.asArray(room.gallery),
      )
      .find(Boolean);

    return {
      id: property.id,
      slug: property.slug,
      name: property.name,
      description: property.description,
      propertyType: property.propertyType,
      supportedRentalTerms:
        property.supportedRentalTerms || [],
      destination: property.destination,
      city: property.city,
      country: property.country,
      area: property.area,
      address: property.address,
      fullAddress: property.fullAddress,
      latitude: property.latitude?.toString(),
      longitude: property.longitude?.toString(),
      buildingName: property.buildingName,
      rating: Number(property.rating || 0),
      reviewCount: property.reviewCount || 0,
      minPrice,
      maxPrice,
      currency: property.currency || 'IDR',
      coverImage: images[0] || firstRoomImage || null,
      gallery: images,
      roomTypes: roomTypes.map((roomType: any) => ({
        id: roomType.id,
        name: roomType.name,
        bedroomType: roomType.bedroomType,
        capacity: roomType.capacity,
        totalRooms: roomType.totalRooms,
        basePrice:
          roomType.basePrice?.toString() || null,
        unitFacilities:
          roomType.unitFacilities || [],
        gallery: this.asArray(roomType.gallery),
      })),
      rooms: detail
        ? rooms.map((room: any) => ({
            id: room.id,
            name: room.name,
            description: room.description,
            price: room.price?.toString(),
            capacity: room.capacity,
            roomType: room.roomType,
            tower: room.tower,
            floor: room.floor,
            electricityWatt:
              room.electricityWatt,
            unitFacilities:
              room.unitFacilities || [],
            additionalInfo:
              room.additionalInfo,
            gallery: this.asArray(room.gallery),
          }))
        : [],
      propertyFacilities:
        property.propertyFacilities || [],
      buildingFacilities:
        property.buildingFacilities || [],
      additionalInfo: property.additionalInfo,
      createdAt: property.createdAt,
    };
  }

  private sortProperties(
    properties: any[],
    sort?: string,
  ) {
    const sorted = [...properties];

    if (sort === 'price_asc') {
      return sorted.sort(
        (a, b) =>
          (a.minPrice ?? Number.MAX_SAFE_INTEGER) -
          (b.minPrice ?? Number.MAX_SAFE_INTEGER),
      );
    }

    if (sort === 'price_desc') {
      return sorted.sort(
        (a, b) => (b.minPrice || 0) - (a.minPrice || 0),
      );
    }

    if (sort === 'newest') {
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
    }

    return sorted.sort((a, b) => {
      const ratingDiff =
        (b.rating || 0) - (a.rating || 0);

      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });
  }

  private asArray(value: any) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    return [];
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
