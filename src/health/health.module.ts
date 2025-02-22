import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
