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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { SCREEN_CODES } from '../permissions/permissions.constants';
import {
  CounterpartyQueryDto,
  CreateCounterpartyDto,
  CreateOfferDto,
  OfferQueryDto,
  UpdateCounterpartyDto,
  UpdateOfferDto,
} from './dto/counterparty.dto';
import { CounterpartiesService } from './counterparties.service';

@ApiTags('counterparties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class CounterpartiesController {
  constructor(private readonly counterpartiesService: CounterpartiesService) {}

  @Get('counterparties')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'read')
  findAll(@Query() query: CounterpartyQueryDto) {
    return this.counterpartiesService.findAll(query);
  }

  @Get('counterparties/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'read')
  findOne(@Param('id') id: string) {
    return this.counterpartiesService.findOne(id);
  }

  @Post('counterparties')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'create')
  create(@Body() dto: CreateCounterpartyDto) {
    return this.counterpartiesService.create(dto);
  }

  @Patch('counterparties/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'update')
  update(@Param('id') id: string, @Body() dto: UpdateCounterpartyDto) {
    return this.counterpartiesService.update(id, dto);
  }

  @Delete('counterparties/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'delete')
  remove(@Param('id') id: string) {
    return this.counterpartiesService.remove(id);
  }

  @Get('counterparty-offers')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'read')
  findOffers(@Query() query: OfferQueryDto) {
    return this.counterpartiesService.findOffers(query);
  }

  @Get('counterparty-offers/by-material/:materialId')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'read')
  findOffersByMaterial(@Param('materialId') materialId: string) {
    return this.counterpartiesService.findOffersByMaterial(materialId);
  }

  @Post('counterparty-offers')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'create')
  createOffer(@Body() dto: CreateOfferDto) {
    return this.counterpartiesService.createOffer(dto);
  }

  @Patch('counterparty-offers/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'update')
  updateOffer(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.counterpartiesService.updateOffer(id, dto);
  }

  @Delete('counterparty-offers/:id')
  @RequirePermission(SCREEN_CODES.REFERENCES, 'delete')
  removeOffer(@Param('id') id: string) {
    return this.counterpartiesService.removeOffer(id);
  }
}
