import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { RequirePermission } from './decorators/require-permission.decorator';
import { UpdatePermissionsMatrixDto } from './dto/permissions.dto';
import { PermissionsGuard } from './guards/permissions.guard';
import { SCREEN_CODES } from './permissions.constants';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Права текущего пользователя' })
  getMyPermissions(@CurrentUser() user: AuthUser) {
    return this.permissionsService.getMyPermissions(user.role);
  }

  @Get('matrix')
  @RequirePermission(SCREEN_CODES.PERMISSIONS, 'read')
  @ApiOperation({ summary: 'Матрица доступов (admin)' })
  getMatrix() {
    return this.permissionsService.getMatrix();
  }

  @Put('matrix')
  @RequirePermission(SCREEN_CODES.PERMISSIONS, 'update')
  @ApiOperation({ summary: 'Обновить матрицу доступов (admin)' })
  updateMatrix(@Body() dto: UpdatePermissionsMatrixDto) {
    return this.permissionsService.updateMatrix(dto);
  }
}
