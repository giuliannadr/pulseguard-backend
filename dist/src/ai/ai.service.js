"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const generative_ai_1 = require("@google/generative-ai");
let AiService = AiService_1 = class AiService {
    logger = new common_1.Logger(AiService_1.name);
    genAI = null;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        }
        else {
            this.logger.warn('GEMINI_API_KEY is not set. Using mock AI responses.');
        }
    }
    async analyzeCommit(diff) {
        if (!this.genAI) {
            return {
                riskType: 'Mock Logic Flaw',
                severity: 'Medium',
                description: 'This is a mock AI analysis because GEMINI_API_KEY is not set. The commit diff might contain unhandled promise rejections.',
                recommendation: 'Add proper try-catch blocks or error handling middleware.',
            };
        }
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: generative_ai_1.SchemaType.OBJECT,
                        properties: {
                            riskType: {
                                type: generative_ai_1.SchemaType.STRING,
                                description: 'The type of security or operational risk (e.g., SQL Injection, Exposed Secret, Logic Bug, Null Pointer, None)',
                            },
                            severity: {
                                type: generative_ai_1.SchemaType.STRING,
                                format: 'enum',
                                enum: ['Critical', 'High', 'Medium', 'Low', 'None'],
                                description: 'The urgency/severity of the issue',
                            },
                            description: {
                                type: generative_ai_1.SchemaType.STRING,
                                description: 'A brief explanation of why this code change is risky or what it breaks',
                            },
                            recommendation: {
                                type: generative_ai_1.SchemaType.STRING,
                                description: 'A code snippet or actionable advice on how to fix the issue',
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
            return JSON.parse(responseText);
        }
        catch (error) {
            this.logger.error('Failed to analyze commit with Gemini API', error);
            return {
                riskType: 'AI Error',
                severity: 'Low',
                description: 'The AI analysis service failed to process the commit.',
                recommendation: 'Check the AI service logs or API key configuration.',
            };
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiService);
//# sourceMappingURL=ai.service.js.map