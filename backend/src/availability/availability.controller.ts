import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AvailabilityService } from './availability.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
  ) {}

  private actorUserId(request: any) {
    const userId = Number(request.user?.sub);

    if (Number.isNaN(userId)) {
      return undefined;
    }

    return userId;
  }

  @Get('calendar')
  @UseGuards(JwtGuard)
  calendar(
    @Query('propertyId') propertyId?: string,
    @Query('roomId') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.availabilityService.calendar({
      propertyId,
      roomId,
      startDate,
      endDate,
    });
  }

  @Get('blocks')
  @UseGuards(JwtGuard)
  findBlocks(
    @Query('roomId') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.availabilityService.findBlocks({
      roomId,
      startDate,
      endDate,
    });
  }

  @Get('daily')
  @UseGuards(JwtGuard)
  dailyAvailability(
    @Query('propertyId') propertyId?: string,
    @Query('roomTypeId') roomTypeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.availabilityService.dailyAvailability({
      propertyId,
      roomTypeId,
      startDate,
      endDate,
    });
  }

  @Post('blocks')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'FINANCE_HEAD')
  createBlock(
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.availabilityService.createBlock(
      body,
      this.actorUserId(request),
    );
  }

  @Delete('blocks/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'FINANCE_HEAD')
  removeBlock(@Param('id') id: string) {
    return this.availabilityService.removeBlock(
      Number(id),
    );
  }
}
