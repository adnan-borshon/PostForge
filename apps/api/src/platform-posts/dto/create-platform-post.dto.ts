import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlatformPostDto {
  @ApiProperty({ example: 'My Video Post Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Description for YouTube', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['tutorial', 'coding'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 'some-platform-account-id' })
  @IsString()
  @IsNotEmpty()
  platformAccountId: string;
}
