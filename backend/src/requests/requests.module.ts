import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [PermissionsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
