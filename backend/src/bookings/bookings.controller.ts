import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { BookingsService } from './bookings.service';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(
      Number(id),
    );
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: any) {
    return this.bookingsService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.bookingsService.update(
      Number(id),
      body,
    );
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(
      Number(id),
    );
  }
}
