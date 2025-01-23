import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

export interface CodeAnalysis {
  quality: string;
  recommendations: string[];
  improvedCode: string;
  performance: string[];
  security: string[];
  bestPractices: string[];
}

@Injectable()
export class CodeReviewService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async analyzeCode(code: string, framework: string): Promise<CodeAnalysis> {
    try {
      const prompt = this.buildPrompt(code, framework);
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const text = response.text();

      try {
        return this.parseAnalysis(text);
      } catch (parseError) {
        console.error('Erro ao processar resposta:', parseError);
        return this.getDefaultAnalysis();
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      return this.getDefaultAnalysis();
    }
  }

  private buildPrompt(code: string, framework: string): string {
    return `Atue como um revisor de código especialista em ${framework}. Analise o código e retorne uma análise em JSON sem formatação markdown.

    CÓDIGO PARA ANÁLISE:
    ${code}

    IMPORTANTE: Primeiro verifique o framework do código. RETORNE apenas um objeto JSON simples com esta estrutura exata (sem blocos de código ou markdown):

    Se o código NÃO for do framework ${framework}, retorne APENAS este JSON:
    {
      "quality": "Este código não é do ${framework}",
      "recommendations": ["Este código parece ser de outro framework ou tecnologia"],
      "improvedCode": "",
      "performance": [],
      "security": [],
      "bestPractices": []
    }

    Se o código FOR do framework ${framework}, sua resposta deve ser um objeto JSON com a seguinte estrutura exata (sem blocos de código ou markdown):
    {
      "quality": "Descrição da qualidade do código",
      "recommendations": ["Recomendação 1", "Recomendação 2"],
      "improvedCode": "Código melhorado com escapes apropriados",
      "performance": ["Sugestão 1", "Sugestão 2"],
      "security": ["Segurança 1", "Segurança 2"],
      "bestPractices": ["Prática 1", "Prática 2"]
    }

    REGRAS:
    1. NÃO use blocos de código markdown o simbolo de CRASE
    2. Use apenas aspas duplas
    3. Escape caracteres especiais
    4. NÃO inclua explicações antes ou depois do JSON`;
  }

  private parseAnalysis(response: string): CodeAnalysis {
    try {
      const responseStr =
        typeof response === 'object' ? JSON.stringify(response) : response;

      if (responseStr.includes('"candidates"')) {
        const geminiResponse = JSON.parse(responseStr);
        const candidateText =
          geminiResponse.candidates[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          throw new Error('Estrutura de resposta inválida');
        }

        const parsedAnalysis = JSON.parse(candidateText);
        return this.formatAnalysis(parsedAnalysis);
      }

      const parsedResponse = JSON.parse(responseStr);
      return this.formatAnalysis(parsedResponse);
    } catch (error) {
      console.error('Erro ao processar análise:', error);
      throw new Error('Falha ao processar a análise do código');
    }
  }

  private formatAnalysis(analysis: any): CodeAnalysis {
    return {
      quality: this.sanitizeString(analysis.quality),
      recommendations: this.sanitizeArray(analysis.recommendations),
      improvedCode: this.sanitizeString(analysis.improvedCode),
      performance: this.sanitizeArray(analysis.performance),
      security: this.sanitizeArray(analysis.security),
      bestPractices: this.sanitizeArray(analysis.bestPractices),
    };
  }

  private sanitizeString(value: any): string {
    if (!value) return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
  }

  private sanitizeArray(value: any): string[] {
    if (!value) return [];
    if (typeof value === 'string') return [value.trim()];
    return Array.isArray(value)
      ? value.map((item) => this.sanitizeString(item)).filter(Boolean)
      : [];
  }

  private getDefaultAnalysis(): CodeAnalysis {
    return {
      quality: 'Não foi possível completar a análise',
      recommendations: ['Por favor, tente novamente em alguns momentos'],
      improvedCode: '',
      performance: [],
      security: [],
      bestPractices: [],
    };
  }
}
