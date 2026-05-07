import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchedulePostDto {
  @ApiProperty({ example: 'some-post-id' })
  @IsString()
  @IsNotEmpty()
  platformPostId: string;

  @ApiProperty({ example: '2024-10-24T15:00:00Z' })
  @IsDateString()
  scheduledAt: string;
}
