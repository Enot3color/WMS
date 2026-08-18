import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { CounterpartiesController } from './counterparties.controller';
import { CounterpartiesService } from './counterparties.service';

@Module({
  imports: [PermissionsModule],
  controllers: [CounterpartiesController],
  providers: [CounterpartiesService],
  exports: [CounterpartiesService],
})
export class CounterpartiesModule {}
