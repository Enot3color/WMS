import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { SCREEN_CODES } from '../permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission(SCREEN_CODES.USERS, 'read')
  @ApiOperation({ summary: 'Список пользователей' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission(SCREEN_CODES.USERS, 'read')
  @ApiOperation({ summary: 'Пользователь по ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermission(SCREEN_CODES.USERS, 'create')
  @ApiOperation({ summary: 'Создать пользователя' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission(SCREEN_CODES.USERS, 'update')
  @ApiOperation({ summary: 'Обновить пользователя' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
