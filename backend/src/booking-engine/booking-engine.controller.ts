import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { BookingEngineService } from './booking-engine.service';

@Controller('booking-engine')
export class BookingEngineController {
  constructor(
    private readonly bookingEngineService: BookingEngineService,
  ) {}

  @Get('availability')
  availability(@Query() query: any) {
    return this.bookingEngineService.availability(
      query,
    );
  }

  @Post('bookings')
  createBooking(
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.bookingEngineService.createBooking(
      body,
      this.optionalActorUserId(request),
    );
  }

  private optionalActorUserId(request: any) {
    const authHeader = String(
      request.headers.authorization || '',
    );

    if (!authHeader.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const payload = jwt.verify(
        authHeader.replace('Bearer ', ''),
        process.env.JWT_SECRET || 'mytrip-secret',
      ) as any;

      return Number(payload.sub) || undefined;
    } catch {
      return undefined;
    }
  }
}
