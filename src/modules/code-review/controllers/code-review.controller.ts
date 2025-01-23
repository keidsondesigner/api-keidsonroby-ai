import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  CodeReviewService,
  CodeAnalysis,
} from '../services/code-review.service';

interface AnalyzeCodeDto {
  code: string;
  framework: string;
}

@Controller('code-review')
export class CodeReviewController {
  constructor(private readonly codeReviewService: CodeReviewService) {}

  @Post('analyze')
  async analyzeCode(@Body() body: AnalyzeCodeDto): Promise<CodeAnalysis> {
    try {
      if (!body.code || !body.framework) {
        throw new BadRequestException('Código e framework são obrigatórios');
      }

      return await this.codeReviewService.analyzeCode(
        body.code,
        body.framework,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
