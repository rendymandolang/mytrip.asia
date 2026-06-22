import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OperationsService } from './operations.service';

@Controller('operations')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN', 'FINANCE_HEAD')
export class OperationsController {
  constructor(
    private readonly operationsService: OperationsService,
  ) {}

  private actorUserId(request: any) {
    const userId = Number(request.user?.sub);

    return Number.isNaN(userId) ? undefined : userId;
  }

  @Get('bookings')
  bookings(@Query() query: any) {
    return this.operationsService.bookings(query);
  }

  @Get('housekeeping')
  housekeeping(@Query() query: any) {
    return this.operationsService.housekeeping(query);
  }

  @Patch('rooms/:roomId/housekeeping')
  updateHousekeeping(
    @Param('roomId') roomId: string,
    @Body() body: any,
  ) {
    return this.operationsService.updateHousekeeping(
      Number(roomId),
      body,
    );
  }

  @Post('bookings/:bookingId/check-in')
  checkIn(
    @Param('bookingId') bookingId: string,
    @Req() request: any,
  ) {
    return this.operationsService.checkIn(
      Number(bookingId),
      this.actorUserId(request),
    );
  }

  @Post('bookings/:bookingId/check-out')
  checkOut(
    @Param('bookingId') bookingId: string,
    @Req() request: any,
  ) {
    return this.operationsService.checkOut(
      Number(bookingId),
      this.actorUserId(request),
    );
  }
}
