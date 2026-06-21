import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  private include = {
    property: true,
    roomType: true,
    room: true,
    uploadedBy: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    },
  };

  async findAll(filters: any, actor?: any) {
    const where: any = {};

    if (filters.propertyId) {
      where.propertyId = this.toNumber(
        filters.propertyId,
        'propertyId',
      );
    }

    if (filters.roomTypeId) {
      where.roomTypeId = this.toNumber(
        filters.roomTypeId,
        'roomTypeId',
      );
    }

    if (filters.roomId) {
      where.roomId = this.toNumber(
        filters.roomId,
        'roomId',
      );
    }

    if (actor?.role === 'OWNER') {
      where.OR = [
        {
          property: {
            ownerId: Number(actor.sub),
          },
        },
        {
          roomType: {
            property: {
              ownerId: Number(actor.sub),
            },
          },
        },
        {
          room: {
            property: {
              ownerId: Number(actor.sub),
            },
          },
        },
      ];
    }

    return this.prisma.mediaAsset.findMany({
      where,
      include: this.include,
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async create(data: any, actor?: any) {
    const mediaData =
      await this.normalizeMediaData(data);

    await this.assertMediaAccess(
      mediaData,
      actor,
    );

    const media =
      await this.prisma.mediaAsset.create({
        data: {
          ...mediaData,
          uploadedById: actor?.sub
            ? Number(actor.sub)
            : null,
        },
        include: this.include,
      });

    await this.syncGallery(media);

    return media;
  }

  async remove(id: number, actor?: any) {
    const media =
      await this.prisma.mediaAsset.findUnique({
        where: { id },
      });

    if (!media) {
      throw new NotFoundException(
        'Media asset not found',
      );
    }

    await this.assertMediaAccess(media, actor);

    const deleted =
      await this.prisma.mediaAsset.delete({
        where: { id },
      });

    await this.syncGallery(deleted);

    return deleted;
  }

  private async normalizeMediaData(data: any) {
    const url = String(data.url || '').trim();

    if (!url) {
      throw new BadRequestException(
        'Media URL is required',
      );
    }

    const mediaData: any = {
      url,
      mediaType: data.mediaType || 'IMAGE',
      category: data.category || null,
      altText: data.altText || null,
      sortOrder:
        data.sortOrder === undefined ||
        data.sortOrder === ''
          ? 0
          : this.toNumber(
              data.sortOrder,
              'sortOrder',
            ),
    };

    for (const field of [
      'propertyId',
      'roomTypeId',
      'roomId',
    ]) {
      if (data[field] !== undefined) {
        mediaData[field] =
          data[field] === null || data[field] === ''
            ? null
            : this.toNumber(data[field], field);
      }
    }

    if (
      !mediaData.propertyId &&
      !mediaData.roomTypeId &&
      !mediaData.roomId
    ) {
      throw new BadRequestException(
        'Media must be attached to a property, room type, or room',
      );
    }

    return mediaData;
  }

  private async assertMediaAccess(
    mediaData: any,
    actor?: any,
  ) {
    if (!actor || actor.role !== 'OWNER') {
      return;
    }

    const ownerId = Number(actor.sub);
    let propertyId = mediaData.propertyId;

    if (!propertyId && mediaData.roomTypeId) {
      const roomType =
        await this.prisma.roomType.findUnique({
          where: {
            id: mediaData.roomTypeId,
          },
          select: {
            propertyId: true,
          },
        });

      propertyId = roomType?.propertyId;
    }

    if (!propertyId && mediaData.roomId) {
      const room = await this.prisma.room.findUnique({
        where: {
          id: mediaData.roomId,
        },
        select: {
          propertyId: true,
        },
      });

      propertyId = room?.propertyId;
    }

    if (!propertyId) {
      throw new ForbiddenException(
        'Media property scope is invalid',
      );
    }

    const property =
      await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId,
        },
      });

    if (!property) {
      throw new ForbiddenException(
        'Owner cannot manage this media',
      );
    }
  }

  private async syncGallery(media: any) {
    if (media.propertyId) {
      await this.syncPropertyGallery(
        media.propertyId,
      );
    }

    if (media.roomTypeId) {
      await this.syncRoomTypeGallery(
        media.roomTypeId,
      );
    }

    if (media.roomId) {
      await this.syncRoomGallery(media.roomId);
    }
  }

  private async syncPropertyGallery(propertyId: number) {
    const media =
      await this.prisma.mediaAsset.findMany({
        where: {
          propertyId,
          mediaType: 'IMAGE',
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      });

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        gallery: media.map((item) => item.url),
      },
    });
  }

  private async syncRoomTypeGallery(
    roomTypeId: number,
  ) {
    const media =
      await this.prisma.mediaAsset.findMany({
        where: {
          roomTypeId,
          mediaType: 'IMAGE',
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      });

    await this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        gallery: media.map((item) => item.url),
      },
    });
  }

  private async syncRoomGallery(roomId: number) {
    const media =
      await this.prisma.mediaAsset.findMany({
        where: {
          roomId,
          mediaType: 'IMAGE',
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      });

    await this.prisma.room.update({
      where: { id: roomId },
      data: {
        gallery: media.map((item) => item.url),
      },
    });
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
