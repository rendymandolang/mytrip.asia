import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { RoomsModule } from './rooms/rooms.module';
import { RoomTypesModule } from './room-types/room-types.module';
import { BookingsModule } from './bookings/bookings.module';
import { AvailabilityModule } from './availability/availability.module';
import { AllotmentsModule } from './allotments/allotments.module';
import { CatalogModule } from './catalog/catalog.module';
import { PricingRulesModule } from './pricing-rules/pricing-rules.module';
import { MediaModule } from './media/media.module';
import { BookingEngineModule } from './booking-engine/booking-engine.module';
import { OwnerModule } from './owner/owner.module';
import { FinanceModule } from './finance/finance.module';
import { OperationsModule } from './operations/operations.module';
import { ChannelManagerModule } from './channel-manager/channel-manager.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    AuthModule,
    PropertiesModule,
    RoomTypesModule,
    RoomsModule,
    BookingsModule,
    AvailabilityModule,
    AllotmentsModule,
    CatalogModule,
    PricingRulesModule,
    MediaModule,
    BookingEngineModule,
    OwnerModule,
    FinanceModule,
    OperationsModule,
    ChannelManagerModule,
    UploadsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
