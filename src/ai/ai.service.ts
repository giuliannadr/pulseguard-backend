import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface SecurityAnalysis {
  riskType: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
  description: string;
  recommendation: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. Using mock AI responses.');
    }
  }

  async analyzeCommit(diff: string): Promise<SecurityAnalysis> {
    if (!this.genAI) {
      // Mock response for testing when API key is not available
      return {
        riskType: 'Mock Logic Flaw',
        severity: 'Medium',
        description:
          'This is a mock AI analysis because GEMINI_API_KEY is not set. The commit diff might contain unhandled promise rejections.',
        recommendation:
          'Add proper try-catch blocks or error handling middleware.',
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              riskType: {
                type: SchemaType.STRING,
                description:
                  'The type of security or operational risk (e.g., SQL Injection, Exposed Secret, Logic Bug, Null Pointer, None)',
              },
              severity: {
                type: SchemaType.STRING,
                format: 'enum',
                enum: ['Critical', 'High', 'Medium', 'Low', 'None'],
                description: 'The urgency/severity of the issue',
              },
              description: {
                type: SchemaType.STRING,
                description:
                  'A brief explanation of why this code change is risky or what it breaks',
              },
              recommendation: {
                type: SchemaType.STRING,
                description:
                  'A code snippet or actionable advice on how to fix the issue',
              },
            },
            required: ['riskType', 'severity', 'description', 'recommendation'],
          },
        },
      });

      const prompt = `
      Sos un ingeniero experto en DevSecOps y SRE. Analizá el siguiente diff de commit de Git. Responde SIEMPRE en español.
      Identificá vulnerabilidades de seguridad, bugs críticos o regresiones de performance que puedan causar fallas o exponer datos.

      Si el código es seguro, ponés severity 'None', riskType 'None' y una descripción corta diciendo que se ve bien.
      Sé conciso: la descripción en máximo 2 oraciones, la recomendación en máximo 1 oración accionable.

      Diff del commit:
      ${diff}
      `;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
      }
      return JSON.parse(responseText) as SecurityAnalysis;
    } catch (error) {
      this.logger.error('Failed to analyze commit with Gemini API', error);
      return {
        riskType: 'AI Error',
        severity: 'Low',
        description: 'The AI analysis service failed to process the commit.',
        recommendation: 'Check the AI service logs or API key configuration.',
      };
    }
  }
}
