import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email, телефон или логин',
  })
  @IsString()
  @MinLength(3)
  identifier: string;

  @ApiProperty({ example: 'admin12345' })
  @IsString()
  @MinLength(8)
  password: string;
}
