import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  normalizeEmail,
  normalizeLogin,
  normalizePhone,
} from '../common/user.utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  login: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const email = normalizeEmail(dto.email);
    const login = normalizeLogin(dto.login);
    const phone = normalizePhone(dto.phone);

    await this.ensureUniqueFields({ email, login, phone });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        login,
        phone,
        role: dto.role,
        passwordHash,
      },
      select: publicUserSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const email = dto.email ? normalizeEmail(dto.email) : undefined;
    const login = dto.login ? normalizeLogin(dto.login) : undefined;
    const phone = dto.phone ? normalizePhone(dto.phone) : undefined;

    await this.ensureUniqueFields({ email, login, phone }, id);

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        email,
        login,
        phone,
        role: dto.role,
        isActive: dto.isActive,
        passwordHash,
      },
      select: publicUserSelect,
    });
  }

  private async ensureUniqueFields(
    fields: {
      email?: string;
      login?: string;
      phone?: string;
    },
    excludeId?: string,
  ) {
    const checks = [
      fields.email
        ? this.prisma.user.findFirst({
            where: { email: fields.email, ...(excludeId && { id: { not: excludeId } }) },
          })
        : null,
      fields.login
        ? this.prisma.user.findFirst({
            where: { login: fields.login, ...(excludeId && { id: { not: excludeId } }) },
          })
        : null,
      fields.phone
        ? this.prisma.user.findFirst({
            where: { phone: fields.phone, ...(excludeId && { id: { not: excludeId } }) },
          })
        : null,
    ];

    const [emailUser, loginUser, phoneUser] = await Promise.all(checks);

    if (emailUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    if (loginUser) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    if (phoneUser) {
      throw new ConflictException('Пользователь с таким телефоном уже существует');
    }
  }
}
