import { Module } from '@nestjs/common';
import { ChannelManagerController } from './channel-manager.controller';
import { ChannelManagerService } from './channel-manager.service';

@Module({
  controllers: [ChannelManagerController],
  providers: [ChannelManagerService],
  exports: [ChannelManagerService],
})
export class ChannelManagerModule {}
