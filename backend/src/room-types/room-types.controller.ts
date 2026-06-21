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
import { RoomTypesService } from './room-types.service';

@Controller('room-types')
export class RoomTypesController {
  constructor(
    private readonly roomTypesService: RoomTypesService,
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll(
    @Query('propertyId') propertyId?: string,
  ) {
    return this.roomTypesService.findAll(
      propertyId,
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.roomTypesService.findOne(
      Number(id),
    );
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  create(@Body() body: any) {
    return this.roomTypesService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.roomTypesService.update(
      Number(id),
      body,
    );
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.roomTypesService.remove(
      Number(id),
    );
  }
}
