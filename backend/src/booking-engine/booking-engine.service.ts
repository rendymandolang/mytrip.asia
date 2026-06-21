import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BookingsService } from '../bookings/bookings.service';
import { PricingRulesService } from '../pricing-rules/pricing-rules.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingEngineService {
  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
    private pricingRulesService: PricingRulesService,
  ) {}

  async availability(query: any) {
    const { property, checkIn, checkOut, rentalTerm } =
      await this.resolveAvailabilityInput(query);

    const roomTypes =
      await this.prisma.roomType.findMany({
        where: {
          propertyId: property.id,
          ...(query.roomTypeId
            ? {
                id: this.toNumber(
                  query.roomTypeId,
                  'roomTypeId',
                ),
              }
            : {}),
        },
        include: {
          rooms: {
            where: {
              housekeepingStatus: {
                not: 'OUT_OF_SERVICE',
              },
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
        orderBy: {
          basePrice: 'asc',
        },
      });

    const results: any[] = [];

    for (const roomType of roomTypes) {
      const availableRooms: any[] = [];

      for (const room of roomType.rooms) {
        if (
          await this.isRoomAvailable(
            room.id,
            checkIn,
            checkOut,
          )
        ) {
          availableRooms.push(room);
        }
      }

      if (availableRooms.length === 0) {
        continue;
      }

      const fallbackBasePrice =
        roomType.basePrice ||
        availableRooms[0]?.price ||
        null;

      const quote =
        await this.pricingRulesService.calculateQuote({
          propertyId: property.id,
          roomTypeId: roomType.id,
          rentalTerm,
          checkIn,
          checkOut,
          fallbackBasePrice:
            fallbackBasePrice?.toString(),
        });

      results.push({
        roomType: {
          id: roomType.id,
          name: roomType.name,
          bedroomType: roomType.bedroomType,
          capacity: roomType.capacity,
          gallery: roomType.gallery || [],
        },
        availableRooms: availableRooms.length,
        firstAvailableRoomId: availableRooms[0].id,
        quote,
      });
    }

    return {
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug,
        currency: property.currency,
      },
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      rentalTerm,
      options: results,
    };
  }

  async createBooking(data: any) {
    const availability =
      await this.availability(data);

    const selectedOption =
      availability.options.find(
        (option: any) =>
          !data.roomTypeId ||
          option.roomType.id ===
            this.toNumber(
              data.roomTypeId,
              'roomTypeId',
            ),
      );

    if (!selectedOption) {
      throw new BadRequestException(
        'No available room found for selected dates',
      );
    }

    const guestData = this.normalizeGuestData(
      data.guest || data,
    );

    const guest = await this.prisma.guest.create({
      data: guestData,
    });

    const booking =
      await this.bookingsService.create({
        guestId: guest.id,
        roomId: selectedOption.firstAvailableRoomId,
        checkIn: availability.checkIn,
        checkOut: availability.checkOut,
        totalAmount:
          selectedOption.quote.totalAmount,
        rentalTerm: availability.rentalTerm,
        pricingSnapshot: selectedOption.quote,
        source: 'BOOKING_ENGINE',
        status: 'PENDING',
      });

    return {
      booking,
      guest,
      quote: selectedOption.quote,
    };
  }

  private async resolveAvailabilityInput(query: any) {
    const property =
      await this.resolveProperty(query);
    const checkIn = new Date(query.checkIn);
    const checkOut = new Date(query.checkOut);

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime()) ||
      checkOut <= checkIn
    ) {
      throw new BadRequestException(
        'Invalid check-in/check-out dates',
      );
    }

    const rentalTerm =
      query.rentalTerm || 'DAILY';

    if (
      !['DAILY', 'MONTHLY', 'YEARLY'].includes(
        rentalTerm,
      )
    ) {
      throw new BadRequestException(
        'Invalid rental term',
      );
    }

    if (
      property.supportedRentalTerms?.length &&
      !property.supportedRentalTerms.includes(
        rentalTerm,
      )
    ) {
      throw new BadRequestException(
        'Rental term is not supported by this property',
      );
    }

    return {
      property,
      checkIn,
      checkOut,
      rentalTerm,
    };
  }

  private async resolveProperty(query: any) {
    const propertyId =
      query.propertyId || query.propertyID;
    const slug = query.slug || query.propertySlug;

    if (!propertyId && !slug) {
      throw new BadRequestException(
        'propertyId or slug is required',
      );
    }

    const property =
      await this.prisma.property.findFirst({
        where: propertyId
          ? {
              id: this.toNumber(
                propertyId,
                'propertyId',
              ),
              isPublished: true,
            }
          : {
              slug,
              isPublished: true,
            },
      });

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    return property;
  }

  private async isRoomAvailable(
    roomId: number,
    checkIn: Date,
    checkOut: Date,
  ) {
    const booking =
      await this.prisma.booking.findFirst({
        where: {
          roomId,
          status: {
            not: 'CANCELLED',
          },
          checkIn: {
            lt: checkOut,
          },
          checkOut: {
            gt: checkIn,
          },
        },
      });

    if (booking) {
      return false;
    }

    const block =
      await this.prisma.availabilityBlock.findFirst({
        where: {
          roomId,
          startDate: {
            lt: checkOut,
          },
          endDate: {
            gt: checkIn,
          },
        },
      });

    return !block;
  }

  private normalizeGuestData(data: any) {
    const fullName = String(
      data.fullName || data.name || '',
    ).trim();
    const email = String(data.email || '').trim();

    if (!fullName) {
      throw new BadRequestException(
        'Guest full name is required',
      );
    }

    if (!email) {
      throw new BadRequestException(
        'Guest email is required',
      );
    }

    return {
      fullName,
      email,
      phone: data.phone || null,
      country: data.country || null,
      notes: data.notes || null,
    };
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
