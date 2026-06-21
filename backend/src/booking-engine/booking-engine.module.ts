import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { PricingRulesModule } from '../pricing-rules/pricing-rules.module';
import { BookingEngineController } from './booking-engine.controller';
import { BookingEngineService } from './booking-engine.service';

@Module({
  imports: [BookingsModule, PricingRulesModule],
  controllers: [BookingEngineController],
  providers: [BookingEngineService],
})
export class BookingEngineModule {}
