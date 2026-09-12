import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('health')
  health() {
    return { service: 'SchichtPro Auth', status: 'ready' };
  }
}
