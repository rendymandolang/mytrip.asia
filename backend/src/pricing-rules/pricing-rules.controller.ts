import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PricingRulesService } from './pricing-rules.service';

@Controller('pricing-rules')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN', 'OWNER')
export class PricingRulesController {
  constructor(
    private readonly pricingRulesService: PricingRulesService,
  ) {}

  @Get()
  findAll(
    @Query('propertyId') propertyId: string,
    @Req() request: any,
  ) {
    return this.pricingRulesService.findAll(
      propertyId,
      request.user,
    );
  }

  @Post()
  create(
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.pricingRulesService.create(
      body,
      request.user,
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.pricingRulesService.update(
      Number(id),
      body,
      request.user,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: any,
  ) {
    return this.pricingRulesService.remove(
      Number(id),
      request.user,
    );
  }
}
