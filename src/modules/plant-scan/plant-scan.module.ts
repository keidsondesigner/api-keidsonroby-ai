import { Module } from '@nestjs/common';
import { PlantScanService } from './services/plant-scan.service';
import { PlantScanController } from './controllers/plant-scan.controller';

@Module({
  controllers: [PlantScanController],
  providers: [PlantScanService],
})
export class PlantScanModule {}
