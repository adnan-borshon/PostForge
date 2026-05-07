import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Awesome Video' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A video about how PostForge works', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
