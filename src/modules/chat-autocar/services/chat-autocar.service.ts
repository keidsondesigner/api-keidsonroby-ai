import { Injectable, Logger } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { FirestoreService } from './firestore.service';

export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface CarData {
  modelo: string;
  ano: number;
  preco: number;
  marca: string;
  especificacoes: {
    motor: string;
    potencia: number;
    combustivel: string;
  };
  cores: string[];
  disponivel: boolean;
}

@Injectable()
export class ChatAutocarService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private readonly logger = new Logger(ChatAutocarService.name);

  constructor(
    private configService: ConfigService,
    private firestoreService: FirestoreService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não encontrada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  private cleanMarkdownResponse(response: string): string {
    // Remove marcadores de código
    response = response.replace(/```json\n/g, '');
    response = response.replace(/```\n/g, '');
    response = response.replace(/```/g, '');

    // Substitui marcadores markdown por tags HTML
    response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
    response = response.replace(/#/g, '');

    // Remove espaços em branco extras e linhas em branco duplicadas
    response = response.replace(/\n\s*\n/g, '\n\n');
    response = response.trim();

    return response;
  }

  private createPrompt(carData: any, userMessage: string): string {
    return `
      Você é um assistente especializado em carros. Use os dados a seguir para responder às perguntas dos usuários:
      ${JSON.stringify(carData)}

      Instruções importantes:
        1. Responda de forma natural e amigável, como se estivesse conversando com um cliente
        2. Use tags HTML para destacar informações importantes:
          - Use <strong>texto</strong> para títulos e informações importantes
          - Use <em>texto</em> para ênfase leve
        3. Use formatação simples com números e letras para listas
        4. Mantenha a resposta clara e bem organizada
        5. Use quebras de linha para separar seções

      Exemplos de formatação:
      <strong>1. Toyota Corolla (2024)</strong>
      Preço: <strong>R$ 192.990</strong>

      Pergunta do usuário: ${userMessage}
    `;
  }

  async processMessage(userMessage: string): Promise<string> {
    try {
      const carData = await this.firestoreService.getCarData();
      const prompt = this.createPrompt(carData, userMessage);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim() === '') {
        throw new Error('Resposta vazia do modelo');
      }

      return this.cleanMarkdownResponse(text);
    } catch (error) {
      this.logger.error('Erro ao processar mensagem:', error);
      throw new Error(
        'Erro ao processar sua mensagem. Por favor, tente novamente.',
      );
    }
  }
}
