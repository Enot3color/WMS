import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { SCREEN_CODES } from '../permissions/permissions.constants';
import { WarehouseService } from './warehouse.service';

@ApiTags('warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('dashboard')
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'read')
  getDashboard() {
    return this.warehouseService.getDashboard();
  }
}
