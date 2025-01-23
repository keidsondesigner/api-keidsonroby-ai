import { Injectable, Logger } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

const ANALYSIS_PROMPT = `Analise esta imagem focando EXCLUSIVAMENTE na planta presente. Ignore completamente quaisquer outros elementos como carros, pessoas, móveis ou objetos. Esta análise deve ser fornecida em português do Brasil.

REGRAS ESTRITAS:
- Analise SOMENTE a planta na imagem
- Ignore COMPLETAMENTE qualquer outro elemento que não seja a planta
- Retorne APENAS o objeto JSON, sem markdown ou formatação adicional
- Se a imagem não contiver uma planta, retorne: {"erro": "Nenhuma planta identificada na imagem"}

TÓPICOS OBRIGATÓRIOS:
1. Identificação Botânica (nome e nome científico)
2. Descrição morfológica (porte, cores, características)
3. Requisitos de cultivo (rega, luz, solo, temperatura)
4. Informações complementares (benefícios, problemas, propagação)

FORMATO DE RESPOSTA:
Retorne exatamente neste formato JSON, sem nenhum texto adicional antes ou depois:
{
  "nome": "Nome popular da planta",
  "nomeCientifico": "Genus species",
  "caracteristicas": "Descrição das características",
  "cuidadosNecessarios": "Detalhes sobre os cuidados",
  "beneficiosCuriosidades": "Benefícios e curiosidades",
  "problemasSolucoes": "Problemas comuns e soluções",
  "metodosPropagacao": "Métodos de propagação"
}`;

export const ERROR_MESSAGES = {
  NO_PLANT_FOUND: 'Nenhuma planta identificada na imagem',
  PROCESSING_ERROR:
    'Não foi possível identificar a planta. Por favor, tente novamente com outra imagem.',
  IMAGE_PROCESSING_ERROR:
    'Erro ao processar a imagem. Por favor, verifique se a imagem é clara e tente novamente.',
  INVALID_RESPONSE: 'Resposta inválida da análise',
};

export interface PlantAnalysis {
  nome: string;
  nomeCientifico: string;
  caracteristicas: string;
  cuidadosNecessarios: string;
  beneficiosCuriosidades: string;
  problemasSolucoes: string;
  metodosPropagacao: string;
}

@Injectable()
export class PlantScanService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private readonly logger = new Logger(PlantScanService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks e qualquer texto antes ou depois do JSON
    return text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
  }

  async identifyPlant(imageData: string): Promise<PlantAnalysis> {
    try {
      // Remove o prefixo data:image/jpeg;base64, se existir
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      };

      // Envio para API
      const result = await this.model.generateContent([
        ANALYSIS_PROMPT,
        imagePart,
      ]);
      this.logger.debug('Resposta da API recebida');

      const response = await result.response;
      const text = await response.text();

      if (!text || text.trim() === '') {
        throw new Error(ERROR_MESSAGES.PROCESSING_ERROR);
      }

      try {
        // Limpa e faz o parse do JSON
        const cleanedJson = this.cleanJsonResponse(text);
        this.logger.debug('JSON limpo:', cleanedJson);

        const jsonResponse = JSON.parse(cleanedJson) as PlantAnalysis;

        // Verifica se é uma resposta de erro
        if ('erro' in jsonResponse) {
          throw new Error(ERROR_MESSAGES.NO_PLANT_FOUND);
        }

        // Verifica se todos os campos necessários estão presentes
        const requiredFields: (keyof PlantAnalysis)[] = [
          'nome',
          'nomeCientifico',
          'caracteristicas',
          'cuidadosNecessarios',
          'beneficiosCuriosidades',
          'problemasSolucoes',
          'metodosPropagacao',
        ];

        const missingFields = requiredFields.filter(
          (field) => !jsonResponse[field],
        );
        if (missingFields.length > 0) {
          this.logger.error('Campos ausentes na resposta:', missingFields);
          throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
        }

        return jsonResponse;
      } catch (parseError) {
        this.logger.error('Erro ao fazer parse da resposta:', parseError);
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }
    } catch (error) {
      this.logger.error('Erro ao identificar planta:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.IMAGE_PROCESSING_ERROR,
      );
    }
  }
}
