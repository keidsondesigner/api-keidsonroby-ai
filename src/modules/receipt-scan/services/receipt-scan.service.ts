import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ReceiptScanService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async analyzeReceipt(file: Express.Multer.File): Promise<string> {
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Por favor, envie apenas arquivos de imagem');
    }

    return this.processReceipt(file);
  }

  private async processReceipt(file: Express.Multer.File): Promise<string> {
    try {
      const imageData = await this.fileToGenerativePart(file);
      const prompt = `Analise este cupom fiscal e extraia as seguintes informações em formato markdown:

      - Data e Hora
      - Valor Total
      - Forma de Pagamento
      - Estabelecimento
      - Número do Cupom/SAT
      - Itens comprados (se visível)
      - Impostos (se informado)

      Por favor, organize as informações em um documento markdown limpo e bem formatado em português.`;

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro no serviço Gemini:', error);
      throw new Error(error.message || 'Falha ao processar o comprovante');
    }
  }

  private async fileToGenerativePart(file: Express.Multer.File) {
    const uint8Array = new Uint8Array(file.buffer);
    return {
      inlineData: {
        data: Buffer.from(uint8Array).toString('base64'),
        mimeType: file.mimetype,
      },
    };
  }
}
