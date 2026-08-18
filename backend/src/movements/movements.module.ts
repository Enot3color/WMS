import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

@Module({
  imports: [PermissionsModule],
  controllers: [MovementsController],
  providers: [MovementsService],
})
export class MovementsModule {}
