import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';

import { PropertiesService } from './properties.service';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get('review-requests/list')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  findReviewRequests(
    @Query('status') status?: string,
  ) {
    return this.propertiesService.findReviewRequests(
      status,
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(
      Number(id),
    );
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  create(@Body() body: any) {
    return this.propertiesService.create(body);
  }

  @Post(':id/approve')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  approve(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.propertiesService.approve(
      Number(id),
      Number(request.user?.sub),
      body?.reviewNote,
    );
  }

  @Post(':id/reject')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  reject(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.propertiesService.reject(
      Number(id),
      Number(request.user?.sub),
      body?.reviewNote,
    );
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.propertiesService.update(
      Number(id),
      body,
    );
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(
      Number(id),
    );
  }
}
