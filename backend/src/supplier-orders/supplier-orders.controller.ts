import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth.interfaces';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { SCREEN_CODES } from '../permissions/permissions.constants';
import {
  CreateSupplierOrderDto,
  SupplierOrderQueryDto,
  UpdateSupplierOrderDto,
} from './dto/supplier-order.dto';
import { SupplierOrdersService } from './supplier-orders.service';

@ApiTags('supplier-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supplier-orders')
export class SupplierOrdersController {
  constructor(private readonly supplierOrdersService: SupplierOrdersService) {}

  @Get()
  @RequirePermission(SCREEN_CODES.SUPPLIER_ORDERS, 'read')
  findAll(@Query() query: SupplierOrderQueryDto) {
    return this.supplierOrdersService.findAll(query);
  }

  @Get('from-request/:requestId')
  @RequirePermission(SCREEN_CODES.SUPPLIER_ORDERS, 'read')
  previewFromRequest(@Param('requestId') requestId: string) {
    return this.supplierOrdersService.previewFromRequest(requestId);
  }

  @Get(':id')
  @RequirePermission(SCREEN_CODES.SUPPLIER_ORDERS, 'read')
  findOne(@Param('id') id: string) {
    return this.supplierOrdersService.findOne(id);
  }

  @Post()
  @RequirePermission(SCREEN_CODES.SUPPLIER_ORDERS, 'create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSupplierOrderDto) {
    return this.supplierOrdersService.create(user.id, dto);
  }

  @Patch(':id')
  @RequirePermission(SCREEN_CODES.SUPPLIER_ORDERS, 'update')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierOrderDto) {
    return this.supplierOrdersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(SCREEN_CODES.SUPPLIER_ORDERS, 'delete')
  remove(@Param('id') id: string) {
    return this.supplierOrdersService.remove(id);
  }
}
