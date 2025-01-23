import { Module } from '@nestjs/common';
import { ReceiptScanController } from './controllers/receipt-scan.controller';
import { ReceiptScanService } from './services/receipt-scan.service';

@Module({
  controllers: [ReceiptScanController],
  providers: [ReceiptScanService],
})
export class ReceiptScanModule {}
