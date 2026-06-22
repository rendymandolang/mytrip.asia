import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AccountService } from './account.service';

@Controller('account')
@UseGuards(JwtGuard)
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
  ) {}

  @Get('bookings')
  bookings(@Req() request: any) {
    return this.accountService.bookings(
      Number(request.user?.sub),
    );
  }
}
