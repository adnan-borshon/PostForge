import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateUploadUrlDto {
  @ApiProperty({ example: 'some-project-id' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'my-video.mp4' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 50000000 })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
