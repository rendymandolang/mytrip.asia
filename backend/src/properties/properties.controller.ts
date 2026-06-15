import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Body,
} from '@nestjs/common';

import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
  ) {}

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(Number(id));
  }

  @Post()
  create(@Body() body: any) {
    return this.propertiesService.create(body);
  }

@Delete(':id')
remove(@Param('id') id: string) {
  return this.propertiesService.remove(
    Number(id),
  );
}

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.propertiesService.update(
      Number(id),
      body,
    );
  }
}
