"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PlaygroundService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaygroundService = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("../ai/ai.service");
const checker_service_1 = require("../checker/checker.service");
const axios_1 = __importDefault(require("axios"));
const dns = __importStar(require("dns"));
const tls = __importStar(require("tls"));
const generative_ai_1 = require("@google/generative-ai");
const ssrf_guard_1 = require("../common/ssrf-guard");
let PlaygroundService = PlaygroundService_1 = class PlaygroundService {
    aiService;
    checkerService;
    logger = new common_1.Logger(PlaygroundService_1.name);
    genAI = null;
    constructor(aiService, checkerService) {
        this.aiService = aiService;
        this.checkerService = checkerService;
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        }
    }
    cleanJson(text) {
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
        }
        return cleaned;
    }
    async auditEndpoint(url, method, headers, body) {
        await (0, ssrf_guard_1.assertSafeUrl)(url);
        const startTime = Date.now();
        let status = 0;
        let responseHeaders = {};
        let responseBody = null;
        let latencyMs = 0;
        let errorMsg = null;
        try {
            const response = await (0, axios_1.default)({
                url,
                method: method,
                headers,
                data: body,
                timeout: 10000,
                validateStatus: () => true,
            });
            status = response.status;
            responseHeaders = response.headers;
            responseBody = response.data;
            latencyMs = Date.now() - startTime;
        }
        catch (e) {
            errorMsg = e.message;
            latencyMs = Date.now() - startTime;
        }
        let aiAuditReport = {
            overallRisk: 'None',
            findings: [],
            recommendation: 'All secure.'
        };
        if (this.genAI) {
            try {
                const model = this.genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: {
                                overallRisk: {
                                    type: generative_ai_1.SchemaType.STRING,
                                    format: 'enum',
                                    enum: ['Critical', 'High', 'Medium', 'Low', 'None'],
                                },
                                findings: {
                                    type: generative_ai_1.SchemaType.ARRAY,
                                    items: { type: generative_ai_1.SchemaType.STRING },
                                    description: 'List of issues found (e.g. CORS mismatch, missing HSTS, exposed backend technology stack, verbose database errors)'
                                },
                                recommendation: {
                                    type: generative_ai_1.SchemaType.STRING,
                                    description: 'Actionable steps to fix this endpoint'
                                }
                            },
                            required: ['overallRisk', 'findings', 'recommendation'],
                        }
                    }
                });
                const prompt = `
        Eres un experto en seguridad de APIs. Analizá los siguientes detalles de solicitud/respuesta y detectá problemas de seguridad.
        Responde SIEMPRE en español. Sé conciso y directo.

        URL: ${url}
        Método: ${method}
        Status HTTP: ${status}
        Headers de respuesta: ${JSON.stringify(responseHeaders)}
        Body de respuesta (truncado): ${JSON.stringify(responseBody).substring(0, 800)}
        Error: ${errorMsg || 'Ninguno'}

        Para cada hallazgo, explicá brevemente el riesgo en una oración. Las recomendaciones deben ser accionables y cortas.
        `;
                const result = await model.generateContent(prompt);
                aiAuditReport = JSON.parse(this.cleanJson(result.response.text()));
            }
            catch (err) {
                this.logger.error('Gemini API Audit failed', err);
                aiAuditReport = {
                    overallRisk: 'Low',
                    findings: ['API audit failed to process response with AI'],
                    recommendation: 'Check the backend logs.'
                };
            }
        }
        return {
            status,
            responseHeaders,
            responseBody: typeof responseBody === 'object' ? responseBody : { text: String(responseBody).substring(0, 1000) },
            latencyMs,
            errorMsg,
            audit: aiAuditReport,
        };
    }
    async auditCode(code, language) {
        if (!this.genAI) {
            return {
                severity: 'Medium',
                findings: ['GEMINI_API_KEY is not configured.'],
                recommendations: 'Configure GEMINI_API_KEY in backend environment.'
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
                            severity: { type: generative_ai_1.SchemaType.STRING, format: 'enum', enum: ['Critical', 'High', 'Medium', 'Low', 'None'] },
                            findings: { type: generative_ai_1.SchemaType.ARRAY, items: { type: generative_ai_1.SchemaType.STRING } },
                            recommendations: { type: generative_ai_1.SchemaType.STRING }
                        },
                        required: ['severity', 'findings', 'recommendations']
                    }
                }
            });
            const prompt = `
      Realizá un análisis SAST del siguiente fragmento de código. Responde SIEMPRE en español.
      Lenguaje/Contexto: ${language}

      Identificá vulnerabilidades, secretos hardcodeados, configuraciones inseguras o dependencias riesgosas.
      Cada hallazgo debe ser una oración corta y directa. Las recomendaciones deben ser accionables.

      Código:
      ${code}
      `;
            const result = await model.generateContent(prompt);
            return JSON.parse(this.cleanJson(result.response.text()));
        }
        catch (e) {
            this.logger.error('Failed to audit code with Gemini', e);
            return {
                severity: 'Low',
                findings: ['AI could not audit this snippet. Check format.'],
                recommendations: 'Ensure the code is valid syntax.'
            };
        }
    }
    async inspectDomain(domain) {
        const cleanDomain = domain.replace(/https?:\/\//, '').split('/')[0].split(':')[0];
        await (0, ssrf_guard_1.assertSafeUrl)(`https://${cleanDomain}`);
        const dnsInfo = {};
        const resolveTxt = (name) => {
            return new Promise((res) => {
                dns.resolveTxt(name, (err, records) => {
                    if (err)
                        res([]);
                    else
                        res(records);
                });
            });
        };
        const resolveMx = (name) => {
            return new Promise((res) => {
                dns.resolveMx(name, (err, records) => {
                    if (err)
                        res([]);
                    else
                        res(records);
                });
            });
        };
        const [txtRecords, mxRecords, dmarcRecords] = await Promise.all([
            resolveTxt(cleanDomain),
            resolveMx(cleanDomain),
            resolveTxt(`_dmarc.${cleanDomain}`)
        ]);
        dnsInfo.spf = txtRecords.flat().find(r => r.startsWith('v=spf1')) ?? 'No SPF record found';
        dnsInfo.dmarc = dmarcRecords.flat().find(r => r.startsWith('v=DMARC1')) ?? 'No DMARC record found';
        dnsInfo.mx = mxRecords.map(r => `${r.exchange} (Priority: ${r.priority})`);
        let sslInfo = { status: 'Unknown' };
        const checkSSL = () => {
            return new Promise((res) => {
                const socket = tls.connect({
                    host: cleanDomain,
                    port: 443,
                    servername: cleanDomain,
                    rejectUnauthorized: false
                }, () => {
                    const cert = socket.getPeerCertificate();
                    if (cert && Object.keys(cert).length > 0) {
                        res({
                            status: socket.authorized ? 'Valid' : 'Invalid/Self-Signed',
                            subject: cert.subject?.CN,
                            issuer: cert.issuer?.O,
                            validFrom: cert.valid_from,
                            validTo: cert.valid_to,
                            bits: cert.bits
                        });
                    }
                    else {
                        res({ status: 'No Certificate Found' });
                    }
                    socket.end();
                });
                socket.on('error', (e) => {
                    res({ status: 'Error connecting: ' + e.message });
                });
            });
        };
        sslInfo = await checkSSL();
        let aiReport = {
            securityScore: 'B',
            dnsFindings: [],
            sslFindings: [],
            advice: 'All looks decent.'
        };
        if (this.genAI) {
            try {
                const model = this.genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: {
                                securityScore: { type: generative_ai_1.SchemaType.STRING },
                                dnsFindings: { type: generative_ai_1.SchemaType.ARRAY, items: { type: generative_ai_1.SchemaType.STRING } },
                                sslFindings: { type: generative_ai_1.SchemaType.ARRAY, items: { type: generative_ai_1.SchemaType.STRING } },
                                advice: { type: generative_ai_1.SchemaType.STRING }
                            },
                            required: ['securityScore', 'dnsFindings', 'sslFindings', 'advice']
                        }
                    }
                });
                const prompt = `
        Analizá la seguridad de DNS y SSL del dominio: ${cleanDomain}. Responde SIEMPRE en español. Sé conciso.

        DNS:
        - SPF: ${dnsInfo.spf}
        - DMARC: ${dnsInfo.dmarc}
        - MX: ${JSON.stringify(dnsInfo.mx)}

        SSL:
        - Estado: ${sslInfo.status}
        - Sujeto: ${sslInfo.subject}
        - Emisor: ${sslInfo.issuer}
        - Válido desde: ${sslInfo.validFrom}
        - Válido hasta: ${sslInfo.validTo}
        - Bits de clave: ${sslInfo.bits}

        El puntaje de seguridad debe ser una letra (A+, A, B, C, D, F). Los hallazgos deben ser oraciones cortas.
        `;
                const result = await model.generateContent(prompt);
                aiReport = JSON.parse(this.cleanJson(result.response.text()));
            }
            catch (e) {
                this.logger.error('Gemini DNS/SSL analysis failed', e);
            }
        }
        return {
            domain: cleanDomain,
            dnsInfo,
            sslInfo,
            audit: aiReport
        };
    }
    async simulateAttack(url, attackType) {
        await (0, ssrf_guard_1.assertSafeUrl)(url);
        let payload = '';
        let description = '';
        const headers = {
            'User-Agent': 'PulseGuard-Security-Simulator/1.0',
            'Content-Type': 'application/json',
        };
        if (attackType === 'sqli') {
            payload = "?id=1'+OR+'1'='1'--&username=admin'--";
            description = "SQL Injection probe using single quotes and logic conditions OR '1'='1'";
        }
        else if (attackType === 'xss') {
            payload = "?q=%3Cscript%3Econsole.log('pulseguard-xss-test')%3C/script%3E";
            description = "Cross-Site Scripting probe attempting inline tag console.log execution";
        }
        else if (attackType === 'sensitive-path') {
            payload = "/.env";
            description = "Path traversal probe attempting to read file /.env containing system variables";
        }
        else if (attackType === 'rate-limit') {
            description = "Rate Limiting test sending 5 concurrent requests in quick succession";
        }
        const testUrl = attackType === 'sensitive-path' ? `${url.replace(/\/$/, '')}${payload}` : `${url}${payload}`;
        const results = [];
        if (attackType === 'rate-limit') {
            const promises = Array.from({ length: 5 }).map(() => axios_1.default.get(url, { headers, timeout: 5000, validateStatus: () => true })
                .then(res => ({ status: res.status, ok: res.status !== 429 }))
                .catch(e => ({ status: 0, error: e.message })));
            const responses = await Promise.all(promises);
            responses.forEach((r, idx) => {
                results.push({ requestNum: idx + 1, status: r.status, statusText: r.status === 429 ? 'Blocked (429)' : 'Allowed' });
            });
        }
        else {
            try {
                const response = await (0, axios_1.default)({
                    url: testUrl,
                    method: 'GET',
                    headers,
                    timeout: 8000,
                    validateStatus: () => true,
                });
                results.push({
                    status: response.status,
                    responseHeaders: response.headers,
                    bodySnippet: typeof response.data === 'string' ? response.data.substring(0, 500) : JSON.stringify(response.data).substring(0, 500)
                });
            }
            catch (err) {
                results.push({ error: err.message });
            }
        }
        const mainResult = results[0];
        const isRateLimit = attackType === 'rate-limit';
        let defaultIsVulnerable = 'No';
        let defaultSeverity = 'None';
        let defaultDiagnosis = 'No anomalies detected.';
        let defaultMitigation = 'No immediate action required.';
        if (isRateLimit) {
            const blocked = results.some(r => r.status === 429);
            if (!blocked) {
                defaultIsVulnerable = 'Yes';
                defaultSeverity = 'Medium';
                defaultDiagnosis = 'The endpoint did not rate-limit multiple rapid concurrent requests (no HTTP 429 returned).';
                defaultMitigation = 'Implement rate-limiting middleware (e.g., using express-rate-limit or NestJS Throttler).';
            }
            else {
                defaultDiagnosis = 'Rate limiting successfully blocked rapid concurrent requests.';
            }
        }
        else if (mainResult) {
            if (mainResult.status === 200) {
                defaultIsVulnerable = 'Suspected';
                defaultSeverity = 'Low';
                defaultDiagnosis = 'The server responded with 200 OK. Standard diagnostics cannot confirm if input parameters are processed securely without deep analysis.';
                defaultMitigation = 'Perform manual penetration testing to verify input sanitization.';
            }
            else if (mainResult.status && mainResult.status >= 500) {
                defaultIsVulnerable = 'Suspected';
                defaultSeverity = 'Medium';
                defaultDiagnosis = `The server responded with HTTP ${mainResult.status} (Internal Server Error), which might indicate unhandled input processing errors.`;
                defaultMitigation = 'Ensure exceptions are caught and sanitized, and database errors are not exposed.';
            }
            else if (mainResult.status && mainResult.status >= 400 && mainResult.status < 500) {
                defaultIsVulnerable = 'No';
                defaultDiagnosis = `The server correctly blocked the request with HTTP ${mainResult.status}.`;
                defaultMitigation = 'Configuration is correct. Keep monitoring.';
            }
            else if (mainResult.error) {
                defaultIsVulnerable = 'No';
                defaultDiagnosis = `Could not reach target endpoint: ${mainResult.error}`;
            }
        }
        let aiAnalysis = {
            isVulnerable: defaultIsVulnerable,
            severity: defaultSeverity,
            diagnosis: defaultDiagnosis,
            mitigation: defaultMitigation
        };
        if (this.genAI) {
            try {
                const model = this.genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: {
                                isVulnerable: { type: generative_ai_1.SchemaType.STRING, format: 'enum', enum: ['Yes', 'No', 'Suspected'] },
                                severity: { type: generative_ai_1.SchemaType.STRING, format: 'enum', enum: ['Critical', 'High', 'Medium', 'Low', 'None'] },
                                diagnosis: { type: generative_ai_1.SchemaType.STRING },
                                mitigation: { type: generative_ai_1.SchemaType.STRING }
                            },
                            required: ['isVulnerable', 'severity', 'diagnosis', 'mitigation']
                        }
                    }
                });
                const prompt = `
        Sos un analista de ciberseguridad. Revisá la respuesta a esta simulación de ataque segura. Responde SIEMPRE en español. Sé conciso y directo.

        Vector de ataque: ${attackType.toUpperCase()}
        Descripción: ${description}
        URL testeada: ${testUrl}
        Resultados: ${JSON.stringify(results)}

        Determine whether the target endpoint is vulnerable to this attack vector.
        Guidelines:
        1. If the server blocked the request (e.g., 403 Forbidden, 401 Unauthorized, 400 Bad Request, 429 Too Many Requests), mark isVulnerable as 'No'.
        2. If the server responded with 200 OK:
           - For SQLi/XSS: Check if the response is just a static health check, status page, or landing page that ignores parameters. If the page is static and does not reflect raw inputs or show database errors, it is NOT vulnerable. Mark isVulnerable as 'No'. Only flag 'Yes' if there is evidence of SQL execution results or raw input reflection (XSS) in the body.
           - For Sensitive Paths (e.g., /.env): If the server returns 200 OK but the body does not contain environment variables (like DB_PASSWORD, API_KEY, etc.) or just returns a generic SPA index.html, it is NOT vulnerable. Mark isVulnerable as 'No'.
        3. If the server responded with 500 Internal Server Error:
           - If it contains raw database error stack traces or Prisma/SQL syntax errors, mark isVulnerable as 'Yes'.
        `;
                const result = await model.generateContent(prompt);
                aiAnalysis = JSON.parse(this.cleanJson(result.response.text()));
            }
            catch (e) {
                this.logger.error('Gemini attack analysis failed', e);
            }
        }
        return {
            attackType,
            description,
            testedUrl: testUrl,
            results,
            analysis: aiAnalysis
        };
    }
    async generatePatch(code, findings, language) {
        if (!this.genAI) {
            return {
                patch: '',
                explanation: 'AI service not configured.'
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
                            patch: { type: generative_ai_1.SchemaType.STRING, description: 'The complete corrected code block or diff resolving the security findings' },
                            explanation: { type: generative_ai_1.SchemaType.STRING, description: 'Explanation of what was fixed and why this resolves the issue' }
                        },
                        required: ['patch', 'explanation']
                    }
                }
            });
            const prompt = `
      You are a senior DevSecOps engineer. Review the following code snippet, which contains security vulnerabilities/findings.
      
      Language/Context: ${language}
      Vulnerabilities/Findings: ${findings}

      Original Code:
      ${code}

      Generate a clean, secure patch to fix the findings. Return a JSON containing the corrected code ("patch") and a brief explanation of the security fixes ("explanation").
      `;
            const result = await model.generateContent(prompt);
            return JSON.parse(this.cleanJson(result.response.text()));
        }
        catch (e) {
            this.logger.error('Failed to generate patch with Gemini', e);
            return {
                patch: '// Error generating patch: ' + e.message,
                explanation: 'Could not generate patch.'
            };
        }
    }
    async getNetworkDiagnostics(url) {
        try {
            const timings = await this.checkerService.measureConnectionDetail(url);
            let aiAdvice = 'All networks phases are operational.';
            if (this.genAI) {
                try {
                    const model = this.genAI.getGenerativeModel({
                        model: 'gemini-2.5-flash',
                        generationConfig: {
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: generative_ai_1.SchemaType.OBJECT,
                                properties: {
                                    advice: { type: generative_ai_1.SchemaType.STRING, description: 'Actionable suggestions to improve network latency or TLS handshake times' }
                                },
                                required: ['advice']
                            }
                        }
                    });
                    const prompt = `
          Sos un arquitecto de infraestructura cloud. Analizá los tiempos de conexión de esta URL: ${url}. Responde SIEMPRE en español.
          - DNS Lookup: ${timings.dnsLookupMs}ms
          - TCP: ${timings.tcpConnectMs}ms
          - TLS Handshake: ${timings.tlsHandshakeMs}ms
          - TTFB: ${timings.ttfbMs}ms
          - Total: ${timings.totalMs}ms

          Dá 1-2 sugerencias concretas y cortas para mejorar la performance (CDN, HTTP/3, DNS, región de servidor, etc).
          `;
                    const result = await model.generateContent(prompt);
                    const parsed = JSON.parse(this.cleanJson(result.response.text()));
                    aiAdvice = parsed.advice;
                }
                catch (err) {
                    this.logger.error('Gemini network diagnostics advice failed', err);
                }
            }
            return {
                success: true,
                timings,
                advice: aiAdvice
            };
        }
        catch (e) {
            return {
                success: false,
                error: e.message || 'Failed to diagnostic URL'
            };
        }
    }
};
exports.PlaygroundService = PlaygroundService;
exports.PlaygroundService = PlaygroundService = PlaygroundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        checker_service_1.CheckerService])
], PlaygroundService);
//# sourceMappingURL=playground.service.js.map