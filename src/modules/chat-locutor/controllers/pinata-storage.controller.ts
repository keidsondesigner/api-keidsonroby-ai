import {
  Controller,
  Get,
  Param,
  Res,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PinataStorageService } from '../services/pinata-storage.service';
import { Readable } from 'stream';

@Controller('chat-locutor/pinata')
export class PinataStorageController {
  private readonly logger = new Logger(PinataStorageController.name);

  constructor(private readonly pinataService: PinataStorageService) {}

  @Get('audio/:path')
  async getAudioUrl(@Param('path') path: string, @Res() res: Response) {
    try {
      this.logger.debug(`Fetching audio for path: ${path}`);

      // Get the full Pinata URL
      const pinataUrl = this.pinataService.getAudioUrl(path);
      this.logger.debug(`Pinata URL: ${pinataUrl}`);

      // Make proxy request to Pinata
      const response = await fetch(pinataUrl, {
        headers: {
          Accept: 'audio/*',
          'User-Agent': 'Locutor-AI-Backend',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to fetch audio: Status ${response.status} ${response.statusText}. Error: ${errorText}`,
        );
        throw new HttpException(
          `Failed to fetch audio: ${response.statusText}`,
          response.status,
        );
      }

      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const contentLength = response.headers.get('content-length');

      this.logger.debug(
        `Audio details - Type: ${contentType}, Size: ${contentLength} bytes`,
      );

      // Set response headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'Content-Disposition': `inline; filename="${path}.mp3"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Cache-Control': 'public, max-age=31536000',
        'Accept-Ranges': 'bytes',
      });

      // Stream the response
      const stream = Readable.from(response.body);
      
      stream.on('error', (error) => {
        this.logger.error('Error during streaming:', error);
        if (!res.headersSent) {
          res.status(HttpStatus.BAD_GATEWAY).json({
            error: 'Streaming error',
            details: error.message,
          });
        }
      });

      stream.pipe(res);
    } catch (error) {
      this.logger.error('Error fetching audio:', error);
      if (!res.headersSent) {
        if (error instanceof HttpException) {
          res.status(error.getStatus()).json(error.getResponse());
        } else {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to fetch audio',
            details: error.message,
          });
        }
      }
    }
  }
}
