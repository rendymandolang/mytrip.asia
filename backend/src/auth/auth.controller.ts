import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  profile(@Req() request: any) {
    return this.authService.profile(
      Number(request.user?.sub),
    );
  }

  @Put('profile')
  @UseGuards(JwtGuard)
  updateProfile(
    @Req() request: any,
    @Body() body: any,
  ) {
    return this.authService.updateProfile(
      Number(request.user?.sub),
      body,
    );
  }
}
