import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
  ) {}

  @Get('destinations')
  destinations() {
    return this.catalogService.destinations();
  }

  @Get('properties')
  properties(@Query() query: any) {
    return this.catalogService.properties(query);
  }

  @Get('properties/:identifier')
  propertyDetail(
    @Param('identifier') identifier: string,
  ) {
    return this.catalogService.propertyDetail(
      identifier,
    );
  }
}
