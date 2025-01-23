import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PlantScanService } from '../services/plant-scan.service';

@Controller('plant')
export class PlantScanController {
  private readonly logger = new Logger(PlantScanController.name);

  constructor(private readonly plantScanService: PlantScanService) {}

  @Post('identify')
  async identifyPlant(@Body() body: { imageData: string }) {
    this.logger.debug('Recebendo requisição para identificar planta');
    return await this.plantScanService.identifyPlant(body.imageData);
  }
}
