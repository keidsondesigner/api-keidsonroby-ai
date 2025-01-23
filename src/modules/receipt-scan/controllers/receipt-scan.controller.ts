import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReceiptScanService } from '../services/receipt-scan.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('ReceiptScan')
@Controller('receipt')
export class ReceiptScanController {
  constructor(private readonly receiptScanService: ReceiptScanService) {}

  @Post('analyze')
  @ApiOperation({
    summary: 'Analyze receipt image',
    description: 'Upload and analyze a receipt image to extract information',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Receipt image file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'ReceiptScan successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(FileInterceptor('file'))
  async analyzeReceipt(@UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.receiptScanService.analyzeReceipt(file);
      return { data: result };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
