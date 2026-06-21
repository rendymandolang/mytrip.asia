import {
  Body,
  Controller,
  Get,
  Param,
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
}
