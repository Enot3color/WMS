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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { SCREEN_CODES } from '../permissions/permissions.constants';
import {
  CreateMaterialDto,
  MaterialQueryDto,
  UpdateMaterialDto,
} from './dto/material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @RequirePermission(SCREEN_CODES.MATERIALS, 'read')
  @ApiOperation({ summary: 'Список материалов' })
  findAll(@Query() query: MaterialQueryDto) {
    return this.materialsService.findAll(query);
  }

  @Get('stock-positions')
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'read')
  @ApiOperation({ summary: 'Складские позиции с минимальными остатками' })
  findStockPositions() {
    return this.materialsService.findStockPositions();
  }

  @Get(':id')
  @RequirePermission(SCREEN_CODES.MATERIALS, 'read')
  @ApiOperation({ summary: 'Материал по ID' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Post()
  @RequirePermission(SCREEN_CODES.MATERIALS, 'create')
  @ApiOperation({ summary: 'Создать материал' })
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Patch(':id')
  @RequirePermission(SCREEN_CODES.MATERIALS, 'update')
  @ApiOperation({ summary: 'Обновить материал' })
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(SCREEN_CODES.MATERIALS, 'delete')
  @ApiOperation({ summary: 'Удалить материал' })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}
