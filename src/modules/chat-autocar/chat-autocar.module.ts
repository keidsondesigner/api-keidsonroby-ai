import { Module } from '@nestjs/common';
import { ChatAutocarService } from './services/chat-autocar.service';
import { ChatAutocarController } from './controllers/chat-autocar.controller';
import { FirestoreService } from './services/firestore.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [ChatAutocarController],
  providers: [ChatAutocarService, FirestoreService],
  exports: [ChatAutocarService],
})
export class ChatAutocarModule {}
