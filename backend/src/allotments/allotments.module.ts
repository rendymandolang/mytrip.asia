import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { AllotmentsController } from './allotments.controller';
import { AllotmentsService } from './allotments.service';

@Module({
  imports: [AvailabilityModule],
  controllers: [AllotmentsController],
  providers: [AllotmentsService],
})
export class AllotmentsModule {}
