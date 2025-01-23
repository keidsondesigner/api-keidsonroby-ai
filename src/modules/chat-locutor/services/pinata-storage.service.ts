import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PinataStorageService {
  private readonly logger = new Logger(PinataStorageService.name);
  private readonly pinataJwt: string;
  private readonly pinataGateway: string;

  constructor(private configService: ConfigService) {
    this.pinataJwt = this.configService.get<string>('PINATA_JWT');
    this.pinataGateway = this.configService.get<string>('PINATA_GATEWAY');

    if (!this.pinataJwt) {
      this.logger.error('PINATA_JWT is not configured');
    }
    if (!this.pinataGateway) {
      this.logger.error('PINATA_GATEWAY is not configured');
    }
  }

  async uploadAudio(audioBuffer: Buffer, filename: string) {
    try {
      this.logger.log(
        `Uploading audio file: ${filename} (${audioBuffer.length} bytes)`,
      );

      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      formData.append('file', blob, filename);

      const response = await fetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.pinataJwt}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Pinata upload failed: ${error}`);
        throw new Error(
          `Pinata upload failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      this.logger.log(
        `File uploaded successfully. IPFS Hash: ${result.IpfsHash}`,
      );

      return { path: result.IpfsHash };
    } catch (error) {
      this.logger.error(`Error uploading to Pinata: ${error.message}`);
      throw error;
    }
  }

  getPinataGateway(): string {
    return this.pinataGateway;
  }

  getAudioUrl(path: string): string {
    if (!this.pinataGateway || !path) {
      this.logger.error('Missing Pinata gateway or path');
      throw new Error('Invalid Pinata configuration');
    }

    return `https://${this.pinataGateway}/ipfs/${path}`;
  }
}
