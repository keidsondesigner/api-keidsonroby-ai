import { Module } from '@nestjs/common';
import { CodeReviewController } from './controllers/code-review.controller';
import { CodeReviewService } from './services/code-review.service';

@Module({
  controllers: [CodeReviewController],
  providers: [CodeReviewService],
})
export class CodeReviewModule {}
