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
      You are an expert DevSecOps and SRE engineer. 
      Analyze the following git commit diff and identify any potential security vulnerabilities, critical bugs, or performance regressions that could cause an API to fail or expose data.
      
      If the code looks completely safe, set severity to 'None', riskType to 'None', and provide a brief description saying it looks good.

      Commit Diff:
      ${diff}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
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
