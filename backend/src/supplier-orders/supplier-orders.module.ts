import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { SupplierOrdersController } from './supplier-orders.controller';
import { SupplierOrdersService } from './supplier-orders.service';

@Module({
  imports: [PermissionsModule],
  controllers: [SupplierOrdersController],
  providers: [SupplierOrdersService],
})
export class SupplierOrdersModule {}
