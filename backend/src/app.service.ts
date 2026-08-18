import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'print-warehouse-api',
      version: '0.1.0',
    };
  }
}
