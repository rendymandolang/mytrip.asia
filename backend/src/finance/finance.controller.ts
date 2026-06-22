import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN', 'FINANCE_HEAD')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
  ) {}

  @Get('summary')
  summary() {
    return this.financeService.summary();
  }

  @Get('invoices')
  findInvoices(@Query() query: any) {
    return this.financeService.findInvoices(query);
  }

  @Post('bookings/:bookingId/invoice')
  createInvoiceForBooking(
    @Param('bookingId') bookingId: string,
  ) {
    return this.financeService.createInvoiceForBooking(
      Number(bookingId),
    );
  }

  @Post('invoices/:invoiceId/payments')
  recordPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() body: any,
  ) {
    return this.financeService.recordPayment(
      Number(invoiceId),
      body,
    );
  }

  @Post('invoices/:invoiceId/void')
  voidInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() body: any,
  ) {
    return this.financeService.voidInvoice(
      Number(invoiceId),
      body?.reason,
    );
  }
}
