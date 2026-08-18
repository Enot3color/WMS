import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CounterpartiesModule } from './counterparties/counterparties.module';
import { MaterialsModule } from './materials/materials.module';
import { MovementsModule } from './movements/movements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReferencesModule } from './references/references.module';
import { RequestsModule } from './requests/requests.module';
import { SupplierOrdersModule } from './supplier-orders/supplier-orders.module';
import { UsersModule } from './users/users.module';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    ReferencesModule,
    CounterpartiesModule,
    MaterialsModule,
    MovementsModule,
    RequestsModule,
    NotificationsModule,
    WarehouseModule,
    SupplierOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
