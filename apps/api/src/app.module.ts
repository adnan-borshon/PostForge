import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { StorageModule } from './storage/storage.module';
import { MediaModule } from './media/media.module';
import { QueueModule } from './queue/queue.module';
import { PlatformsModule } from './platforms/platforms.module';
import { PlatformPostsModule } from './platform-posts/platform-posts.module';
import { SchedulingModule } from './scheduling/scheduling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    StorageModule,
    MediaModule,
    QueueModule,
    PlatformsModule,
    PlatformPostsModule,
    SchedulingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
