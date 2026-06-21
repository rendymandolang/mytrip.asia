import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
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

  private actorUserId(request: any) {
    const userId = Number(request.user?.sub);

    if (Number.isNaN(userId)) {
      return undefined;
    }

    return userId;
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('change-requests/pending')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'FINANCE_HEAD')
  findPendingChangeRequests() {
    return this.bookingsService.findPendingChangeRequests();
  }

  @Post('change-requests/:requestId/approve')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SUPERADMIN', 'FINANCE_HEAD')
  approveChangeRequest(
    @Param('requestId') requestId: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.bookingsService.approveChangeRequest(
      Number(requestId),
      this.actorUserId(request),
      body?.reviewNote,
    );
  }

  @Post('change-requests/:requestId/reject')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SUPERADMIN', 'FINANCE_HEAD')
  rejectChangeRequest(
    @Param('requestId') requestId: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.bookingsService.rejectChangeRequest(
      Number(requestId),
      this.actorUserId(request),
      body?.reviewNote,
    );
  }

  @Get(':id/audit-logs')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'FINANCE_HEAD')
  findAuditLogs(@Param('id') id: string) {
    return this.bookingsService.findAuditLogs(
      Number(id),
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(
      Number(id),
    );
  }

  @Post(':id/change-requests')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'FINANCE_HEAD')
  createChangeRequest(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.bookingsService.createChangeRequest(
      Number(id),
      body,
      this.actorUserId(request),
    );
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: any) {
    return this.bookingsService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'FINANCE_HEAD')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.bookingsService.update(
      Number(id),
      body,
      this.actorUserId(request),
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
