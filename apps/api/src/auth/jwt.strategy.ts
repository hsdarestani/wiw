import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy {
  validate(payload: { sub: string; role: string }) {
    return payload;
  }
}
