import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as trpcExpress from '@trpc/server/adapters/express';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { AppModule } from './app.module';

// Basic tRPC setup for the scaffold
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

export const appRouter = router({
  healthCheck: publicProcedure.query(() => ({ status: 'ok', timestamp: new Date() })),
  getUserProjects: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      // Placeholder for project logic
      return { projects: [], userId: input.userId };
    }),
});

export type AppRouter = typeof appRouter;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  const expressApp = app.getHttpAdapter().getInstance();
  
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('PostForge API')
    .setDescription('The platform for managing and scheduling video uploads')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Register tRPC router
  expressApp.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: () => ({}),
    }),
  );
  
  const port = process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`API is running on: http://localhost:${port}`);
}
bootstrap();
