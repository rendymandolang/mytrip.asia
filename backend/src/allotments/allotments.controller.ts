import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AllotmentsService } from './allotments.service';

@Controller('allotments')
export class AllotmentsController {
  constructor(
    private readonly allotmentsService: AllotmentsService,
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll(
    @Query('propertyId') propertyId?: string,
    @Query('roomTypeId') roomTypeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.allotmentsService.findAll({
      propertyId,
      roomTypeId,
      startDate,
      endDate,
    });
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  upsert(@Body() body: any) {
    return this.allotmentsService.upsert(body);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.allotmentsService.update(
      Number(id),
      body,
    );
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.allotmentsService.remove(
      Number(id),
    );
  }
}
