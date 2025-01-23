import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatLocutorController } from './controllers/chat-locutor.controller';
import { PinataStorageController } from './controllers/pinata-storage.controller';
import { ChatLocutorService } from './services/chat-locutor.service';
import { PinataStorageService } from './services/pinata-storage.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [ChatLocutorController, PinataStorageController],
  providers: [ChatLocutorService, PinataStorageService],
  exports: [ChatLocutorService],
})
export class ChatLocutorModule {}
