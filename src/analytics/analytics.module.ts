import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { databaseProvider } from '../database.provider';
import { redisProvider } from '../redis.provider';

@Module({
  controllers: [AnalyticsController],
  providers: [databaseProvider, redisProvider, AnalyticsService],
})
export class AnalyticsModule {}
