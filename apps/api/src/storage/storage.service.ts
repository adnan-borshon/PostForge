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
      forcePathStyle: true, // Needed for MinIO
      credentials: {
        accessKeyId: accessKey || '',
        secretAccessKey: secretKey || '',
      },
      region: 'us-east-1', // Generic region for S3 compat
    });
  }

  async generatePresignedUploadUrl(key: string, mimeType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async generatePresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3.send(command);
  }

  async getObjectMetadata(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3.send(command);
    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
    };
  }

  getBucketName() {
    return this.bucket;
  }
}
