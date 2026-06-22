import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChannelManagerService } from './channel-manager.service';

@Controller('channel-manager')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN', 'FINANCE_HEAD')
export class ChannelManagerController {
  constructor(
    private readonly channelManagerService: ChannelManagerService,
  ) {}

  @Get('connections')
  connections(@Query() query: any) {
    return this.channelManagerService.connections(
      query,
    );
  }

  @Post('connections')
  createConnection(@Body() body: any) {
    return this.channelManagerService.createConnection(
      body,
    );
  }

  @Patch('connections/:id')
  updateConnection(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.channelManagerService.updateConnection(
      Number(id),
      body,
    );
  }

  @Get('events')
  events(@Query() query: any) {
    return this.channelManagerService.events(query);
  }

  @Post('events')
  createEvent(@Body() body: any) {
    return this.channelManagerService.createEvent(
      body,
    );
  }

  @Post('events/:id/process')
  processEvent(@Param('id') id: string) {
    return this.channelManagerService.processEvent(
      Number(id),
    );
  }

  @Post('events/:id/fail')
  failEvent(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.channelManagerService.failEvent(
      Number(id),
      body?.errorMessage,
    );
  }

  @Post('properties/:propertyId/sync')
  syncProperty(
    @Param('propertyId') propertyId: string,
  ) {
    return this.channelManagerService.syncProperty(
      Number(propertyId),
    );
  }
}
