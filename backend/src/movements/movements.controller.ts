import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth.interfaces';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { SCREEN_CODES } from '../permissions/permissions.constants';
import { CreateMovementDto, MovementQueryDto } from './dto/movement.dto';
import { MovementsService } from './movements.service';

@ApiTags('movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'read')
  @ApiOperation({ summary: 'История движений по складу' })
  findAll(@Query() query: MovementQueryDto) {
    return this.movementsService.findAll(query);
  }

  @Get('summary')
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'read')
  @ApiOperation({ summary: 'Сводка по типам движений' })
  summary() {
    return this.movementsService.getSummary();
  }

  @Get(':id')
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'read')
  @ApiOperation({ summary: 'Документ движения' })
  findOne(@Param('id') id: string) {
    return this.movementsService.findOne(id);
  }

  @Post()
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'create')
  @ApiOperation({ summary: 'Создать поступление или выдачу' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMovementDto) {
    return this.movementsService.create(user.id, dto);
  }
}
