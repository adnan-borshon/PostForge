import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Worker is running and listening to queues...');
  
  // Handle shutdown gracefully
  app.enableShutdownHooks();
}
bootstrap();
