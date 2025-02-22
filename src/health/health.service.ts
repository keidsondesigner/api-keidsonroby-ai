import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly apiUrl = 'https://api-keidsonroby-ai.onrender.com';

  constructor(private configService: ConfigService) {}

  //@Cron(CronExpression.EVERY_10_SECONDS) // Executa a cada 10 segundos - para teste

  @Cron('*/14 * * * *') // Executa a cada 14 minutos
  async checkHealth() {
    try {
      this.logger.log('Executando verificação de saúde da API...');

      const response = await fetch(`${this.apiUrl}/health`);

      if (response.status === 200) {
        this.logger.log('API está saudável e ativa');
      } else {
        this.logger.warn(`API retornou status ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Erro ao verificar saúde da API', error);
    }
  }
}
