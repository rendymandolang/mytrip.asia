import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean {
    console.log('=== JWT GUARD HIT ===');

    const request =
      context.switchToHttp().getRequest();

    const authHeader =
      request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'Authorization header missing',
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Invalid authorization format',
      );
    }

    const token = authHeader.replace(
      'Bearer ',
      '',
    );

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          'mytrip-secret',
      );

      request.user = payload;

      console.log(
        'Authenticated User:',
        payload,
      );

      return true;
    } catch (error) {
      console.error(
        'JWT Error:',
        error.message,
      );

      throw new UnauthorizedException(
        'Invalid token',
      );
    }
  }
}
