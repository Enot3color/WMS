import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { buildUserLookupConditions } from '../common/user.utils';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser, JwtPayload } from './interfaces/auth.interfaces';

const authUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  login: true,
  role: true,
  isActive: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: buildUserLookupConditions(dto.identifier),
      },
      select: {
        ...authUserSelect,
        passwordHash: true,
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return this.buildAuthResponse(this.toAuthUser(user));
  }

  getProfile(user: AuthUser) {
    return { user };
  }

  private toAuthUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    login: string;
    role: AuthUser['role'];
  }): AuthUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      login: user.login,
      role: user.role,
    };
  }

  private buildAuthResponse(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
