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

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN', 'OWNER')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  findAll(
    @Query('propertyId') propertyId?: string,
    @Query('roomTypeId') roomTypeId?: string,
    @Query('roomId') roomId?: string,
    @Req() request?: any,
  ) {
    return this.mediaService.findAll(
      {
        propertyId,
        roomTypeId,
        roomId,
      },
      request.user,
    );
  }

  @Post()
  create(
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.mediaService.create(
      body,
      request.user,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: any,
  ) {
    return this.mediaService.remove(
      Number(id),
      request.user,
    );
  }
}
