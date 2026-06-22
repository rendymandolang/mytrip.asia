import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminUsersService } from './admin-users.service';

@Controller('admin-users')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @Get()
  findAll(@Query() query: any) {
    return this.adminUsersService.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.adminUsersService.stats();
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.adminUsersService.approve(
      Number(id),
      request.user,
      body?.reviewNote,
    );
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.adminUsersService.reject(
      Number(id),
      request.user,
      body?.reviewNote,
    );
  }

  @Post(':id/suspend')
  suspend(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.adminUsersService.suspend(
      Number(id),
      request.user,
      body?.reviewNote,
    );
  }

  @Post(':id/pending')
  markPending(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.adminUsersService.markPending(
      Number(id),
      request.user,
      body?.reviewNote,
    );
  }
}
