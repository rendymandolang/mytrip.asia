import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelManagerService {
  constructor(private prisma: PrismaService) {}

  private connectionInclude = {
    property: true,
  };

  private eventInclude = {
    connection: true,
    property: true,
    booking: {
      include: {
        guest: true,
        room: {
          include: {
            property: true,
          },
        },
      },
    },
  };

  async connections(query: any = {}) {
    const where: any = {};

    if (query.propertyId) {
      where.propertyId = this.toNumber(
        query.propertyId,
        'propertyId',
      );
    }

    if (query.provider) {
      where.provider = {
        contains: String(query.provider),
        mode: 'insensitive',
      };
    }

    if (query.active !== undefined) {
      where.active = this.toBoolean(query.active);
    }

    return this.prisma.channelConnection.findMany({
      where,
      include: this.connectionInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createConnection(data: any) {
    const propertyId = this.toNumber(
      data.propertyId,
      'propertyId',
    );

    const property =
      await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    const provider = String(
      data.provider || '',
    ).trim();

    if (!provider) {
      throw new BadRequestException(
        'Provider is required',
      );
    }

    return this.prisma.channelConnection.create({
      data: {
        propertyId,
        provider,
        externalPropertyId:
          String(data.externalPropertyId || '')
            .trim() || null,
        active:
          data.active === undefined
            ? true
            : this.toBoolean(data.active),
        settings:
          data.settings === undefined
            ? undefined
            : this.normalizeJson(data.settings),
      },
      include: this.connectionInclude,
    });
  }

  async updateConnection(id: number, data: any) {
    await this.ensureConnection(id);

    const updateData: any = {};

    if (data.provider !== undefined) {
      const provider = String(data.provider).trim();

      if (!provider) {
        throw new BadRequestException(
          'Provider is required',
        );
      }

      updateData.provider = provider;
    }

    if (data.externalPropertyId !== undefined) {
      updateData.externalPropertyId =
        String(data.externalPropertyId || '')
          .trim() || null;
    }

    if (data.active !== undefined) {
      updateData.active = this.toBoolean(data.active);
    }

    if (data.settings !== undefined) {
      updateData.settings = this.normalizeJson(
        data.settings,
      );
    }

    return this.prisma.channelConnection.update({
      where: { id },
      data: updateData,
      include: this.connectionInclude,
    });
  }

  async events(query: any = {}) {
    const where: any = {};

    for (const field of [
      'status',
      'direction',
      'eventType',
    ]) {
      if (query[field] && query[field] !== 'ALL') {
        where[field] = String(
          query[field],
        ).toUpperCase();
      }
    }

    if (query.propertyId) {
      where.propertyId = this.toNumber(
        query.propertyId,
        'propertyId',
      );
    }

    if (query.bookingId) {
      where.bookingId = this.toNumber(
        query.bookingId,
        'bookingId',
      );
    }

    return this.prisma.channelSyncEvent.findMany({
      where,
      include: this.eventInclude,
      orderBy: {
        createdAt: 'desc',
      },
      take: query.take
        ? Math.min(
            this.toNumber(query.take, 'take'),
            200,
          )
        : 100,
    });
  }

  async createEvent(data: any) {
    const connectionId =
      data.connectionId === undefined ||
      data.connectionId === null ||
      data.connectionId === ''
        ? null
        : this.toNumber(
            data.connectionId,
            'connectionId',
          );
    const connection = connectionId
      ? await this.ensureConnection(connectionId)
      : null;
    const propertyId =
      data.propertyId === undefined ||
      data.propertyId === null ||
      data.propertyId === ''
        ? connection?.propertyId || null
        : this.toNumber(
            data.propertyId,
            'propertyId',
          );

    return this.prisma.channelSyncEvent.create({
      data: {
        connectionId,
        propertyId,
        bookingId:
          data.bookingId === undefined ||
          data.bookingId === null ||
          data.bookingId === ''
            ? null
            : this.toNumber(
                data.bookingId,
                'bookingId',
              ),
        direction:
          data.direction || 'INBOUND',
        eventType:
          data.eventType || 'BOOKING_CREATED',
        status: data.status || 'PENDING',
        payload:
          data.payload === undefined
            ? {}
            : this.normalizeJson(data.payload),
      },
      include: this.eventInclude,
    });
  }

  async processEvent(id: number) {
    const event =
      await this.prisma.channelSyncEvent.findUnique({
        where: { id },
      });

    if (!event) {
      throw new NotFoundException(
        'Channel event not found',
      );
    }

    const processed =
      await this.prisma.channelSyncEvent.update({
        where: { id },
        data: {
          status: 'PROCESSED',
          attempts: {
            increment: 1,
          },
          processedAt: new Date(),
          errorMessage: null,
        },
        include: this.eventInclude,
      });

    if (event.connectionId) {
      await this.prisma.channelConnection.update({
        where: { id: event.connectionId },
        data: {
          lastSyncAt: new Date(),
        },
      });
    }

    return processed;
  }

  async failEvent(id: number, errorMessage: string) {
    const event =
      await this.prisma.channelSyncEvent.findUnique({
        where: { id },
      });

    if (!event) {
      throw new NotFoundException(
        'Channel event not found',
      );
    }

    return this.prisma.channelSyncEvent.update({
      where: { id },
      data: {
        status: 'FAILED',
        attempts: {
          increment: 1,
        },
        errorMessage:
          String(errorMessage || '').trim() ||
          'Channel sync failed',
      },
      include: this.eventInclude,
    });
  }

  async syncProperty(propertyId: number) {
    const property =
      await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    const connections =
      await this.prisma.channelConnection.findMany({
        where: {
          propertyId,
          active: true,
        },
      });

    const targets = connections.length
      ? connections
      : [null];

    const events: any[] = [];

    for (const connection of targets) {
      events.push(
        await this.prisma.channelSyncEvent.create({
          data: {
            connectionId: connection?.id || null,
            propertyId,
            direction: 'OUTBOUND',
            eventType: 'ARI_UPDATE',
            payload: {
              propertyId,
              propertyName: property.name,
              source: 'MYTRIP_ADMIN',
            },
          },
          include: this.eventInclude,
        }),
      );
    }

    return events;
  }

  async queueBookingOutbound(
    bookingId: number,
    eventType = 'BOOKING_CREATED',
  ) {
    const booking =
      await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          room: true,
          guest: true,
        },
      });

    if (!booking) {
      return null;
    }

    return this.prisma.channelSyncEvent.create({
      data: {
        propertyId: booking.room.propertyId,
        bookingId,
        direction: 'OUTBOUND',
        eventType: eventType as any,
        payload: {
          bookingId,
          roomId: booking.roomId,
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString(),
          status: booking.status,
          guest: booking.guest
            ? {
                fullName: booking.guest.fullName,
                email: booking.guest.email,
              }
            : null,
        },
      },
    });
  }

  private async ensureConnection(id: number) {
    const connection =
      await this.prisma.channelConnection.findUnique({
        where: { id },
      });

    if (!connection) {
      throw new NotFoundException(
        'Channel connection not found',
      );
    }

    return connection;
  }

  private normalizeJson(value: any) {
    if (value === null || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) {
        return null;
      }

      try {
        return JSON.parse(trimmed);
      } catch {
        return {
          raw: trimmed,
        };
      }
    }

    return value;
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
