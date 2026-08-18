import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth.interfaces';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { SCREEN_CODES } from '../permissions/permissions.constants';
import {
  CreateRequestDto,
  RequestQueryDto,
  UpdateRequestDto,
} from './dto/request.dto';
import { RequestsService } from './requests.service';

@ApiTags('requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @RequirePermission(SCREEN_CODES.ORDERS, 'read')
  @ApiOperation({ summary: 'Список заявок' })
  findAll(@Query() query: RequestQueryDto) {
    return this.requestsService.findAll(query);
  }

  @Get('stats')
  @RequirePermission(SCREEN_CODES.ORDERS, 'read')
  @ApiOperation({ summary: 'Статистика заявок по статусам' })
  stats() {
    return this.requestsService.getStats();
  }

  @Get(':id/availability')
  @RequirePermission(SCREEN_CODES.ORDERS, 'read')
  @ApiOperation({ summary: 'Остатки и дефицит по заявке' })
  availability(@Param('id') id: string) {
    return this.requestsService.getAvailability(id);
  }

  @Get(':id')
  @RequirePermission(SCREEN_CODES.ORDERS, 'read')
  @ApiOperation({ summary: 'Заявка по ID' })
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Post()
  @RequirePermission(SCREEN_CODES.ORDERS, 'create')
  @ApiOperation({ summary: 'Создать заявку' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(user.id, dto);
  }

  @Post(':id/mark-seen')
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'update')
  @ApiOperation({ summary: 'Отметить заявку просмотренной кладовщиком' })
  markSeen(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.requestsService.markSeen(id, user.id);
  }

  @Post(':id/issue')
  @RequirePermission(SCREEN_CODES.WAREHOUSE, 'create')
  @ApiOperation({ summary: 'Сформировать выдачу по заявке' })
  issue(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.requestsService.createIssue(id, user.id);
  }

  @Patch(':id')
  @RequirePermission(SCREEN_CODES.ORDERS, 'update')
  @ApiOperation({ summary: 'Обновить заявку' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requestsService.update(id, user.id, dto);
  }
}
