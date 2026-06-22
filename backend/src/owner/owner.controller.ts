import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerService } from './owner.service';

@Controller('owner')
@UseGuards(JwtGuard, RolesGuard)
@Roles('OWNER')
export class OwnerController {
  constructor(
    private readonly ownerService: OwnerService,
  ) {}

  @Get('properties')
  properties(@Req() request: any) {
    return this.ownerService.properties(
      Number(request.user?.sub),
    );
  }

  @Post('properties')
  createProperty(
    @Req() request: any,
    @Body() body: any,
  ) {
    return this.ownerService.createProperty(
      Number(request.user?.sub),
      body,
    );
  }

  @Get('properties/:id')
  property(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.ownerService.property(
      Number(request.user?.sub),
      Number(id),
    );
  }

  @Put('properties/:id')
  updateProperty(
    @Req() request: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.ownerService.updateProperty(
      Number(request.user?.sub),
      Number(id),
      body,
    );
  }

  @Post('properties/:id/submit-review')
  submitPropertyForReview(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.ownerService.submitPropertyForReview(
      Number(request.user?.sub),
      Number(id),
    );
  }

  @Post('properties/:id/room-types')
  createRoomType(
    @Req() request: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.ownerService.createRoomType(
      Number(request.user?.sub),
      Number(id),
      body,
    );
  }

  @Post('properties/:id/rooms')
  createRoom(
    @Req() request: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.ownerService.createRoom(
      Number(request.user?.sub),
      Number(id),
      body,
    );
  }
}
