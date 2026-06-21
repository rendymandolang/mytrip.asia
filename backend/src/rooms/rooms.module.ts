import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomTypesModule } from '../room-types/room-types.module';

@Module({
  imports: [RoomTypesModule],
  controllers: [RoomsController],
  providers: [RoomsService]
})
export class RoomsModule {}
