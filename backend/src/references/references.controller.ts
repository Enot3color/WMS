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
  CreateCategoryDto,
  CreateStatusReferenceDto,
  CreateUnitDto,
  UpdateCategoryDto,
  UpdateStatusReferenceDto,
  UpdateUnitDto,
} from './dto/reference.dto';
import { ReferencesService } from './references.service';

@ApiTags('references')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Get('categories')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'read')
  findCategories() {
    return this.referencesService.findCategories();
  }

  @Post('categories')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'create')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.referencesService.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'update')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.referencesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'delete')
  deleteCategory(@Param('id') id: string) {
    return this.referencesService.deleteCategory(id);
  }

  @Get('units')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'read')
  findUnits() {
    return this.referencesService.findUnits();
  }

  @Post('units')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'create')
  createUnit(@Body() dto: CreateUnitDto) {
    return this.referencesService.createUnit(dto);
  }

  @Patch('units/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'update')
  updateUnit(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.referencesService.updateUnit(id, dto);
  }

  @Delete('units/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'delete')
  deleteUnit(@Param('id') id: string) {
    return this.referencesService.deleteUnit(id);
  }

  @Get('statuses')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'read')
  @ApiOperation({ summary: 'Справочник статусов' })
  findStatusReferences(@Query('group') group?: string) {
    return this.referencesService.findStatusReferences(group);
  }

  @Post('statuses')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'create')
  createStatusReference(@Body() dto: CreateStatusReferenceDto) {
    return this.referencesService.createStatusReference(dto);
  }

  @Patch('statuses/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'update')
  updateStatusReference(@Param('id') id: string, @Body() dto: UpdateStatusReferenceDto) {
    return this.referencesService.updateStatusReference(id, dto);
  }

  @Delete('statuses/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'delete')
  deleteStatusReference(@Param('id') id: string) {
    return this.referencesService.deleteStatusReference(id);
  }
}
