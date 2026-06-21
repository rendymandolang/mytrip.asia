import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

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
  createBooking(@Body() body: any) {
    return this.bookingEngineService.createBooking(
      body,
    );
  }
}
