import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReceiptScanModule } from './modules/receipt-scan/receipt-scan.module';
import { CodeReviewModule } from './modules/code-review/code-review.module';
import { PlantScanModule } from './modules/plant-scan/plant-scan.module';
import { ChatAutocarModule } from './modules/chat-autocar/chat-autocar.module';
import { ChatLocutorModule } from './modules/chat-locutor/chat-locutor.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ReceiptScanModule,
    CodeReviewModule,
    PlantScanModule,
    ChatAutocarModule,
    ChatLocutorModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
