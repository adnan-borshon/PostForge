import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');
    const accessKey = this.configService.get<string>('STORAGE_ACCESS_KEY');
    const secretKey = this.configService.get<string>('STORAGE_SECRET_KEY');
    this.bucket = this.configService.get<string>('STORAGE_BUCKET') || 'postforge';

    this.s3 = new S3Client({
      endpoint: endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey || '',
        secretAccessKey: secretKey || '',
      },
      region: 'us-east-1',
    });
  }

  async generatePresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async uploadFile(key: string, body: Buffer | string, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.s3.send(command);
  }

  async getFileStream(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3.send(command);
    return response.Body;
  }

  getBucketName() {
    return this.bucket;
  }
}
