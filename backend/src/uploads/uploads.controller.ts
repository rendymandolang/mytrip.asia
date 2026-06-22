import {
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('media')
  uploadMedia(@Req() request: any) {
    return this.uploadsService.handleMultipartUpload(
      request,
    );
  }
}
