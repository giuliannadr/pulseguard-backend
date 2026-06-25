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
const axios_1 = __importDefault(require("axios"));
const dns = __importStar(require("dns"));
const tls = __importStar(require("tls"));
const generative_ai_1 = require("@google/generative-ai");
let PlaygroundService = PlaygroundService_1 = class PlaygroundService {
    aiService;
    logger = new common_1.Logger(PlaygroundService_1.name);
    genAI = null;
    constructor(aiService) {
        this.aiService = aiService;
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        }
    }
    async auditEndpoint(url, method, headers, body) {
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
        You are a senior API penetration tester. Analyze the following request & response details for security flaws.
        
        Request URL: ${url}
        Request Method: ${method}
        Response Status: ${status}
        Response Headers: ${JSON.stringify(responseHeaders)}
        Response Body (truncated): ${JSON.stringify(responseBody).substring(0, 800)}
        Error Encountered: ${errorMsg || 'None'}
        `;
                const result = await model.generateContent(prompt);
                aiAuditReport = JSON.parse(result.response.text());
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
      Perform a static application security testing (SAST) analysis on the following code snippet.
      Language/Context: ${language}

      Identify any vulnerabilities, backdoors, dependency risks, hardcoded secrets, or insecure configurations.

      Code Snippet:
      ${code}
      `;
            const result = await model.generateContent(prompt);
            return JSON.parse(result.response.text());
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
        Review the following SSL and DNS security parameters for the domain: ${cleanDomain}

        DNS Info:
        - SPF: ${dnsInfo.spf}
        - DMARC: ${dnsInfo.dmarc}
        - MX: ${JSON.stringify(dnsInfo.mx)}

        SSL Info:
        - Status: ${sslInfo.status}
        - Subject: ${sslInfo.subject}
        - Issuer: ${sslInfo.issuer}
        - Valid From: ${sslInfo.validFrom}
        - Valid To: ${sslInfo.validTo}
        - Key bits: ${sslInfo.bits}
        `;
                const result = await model.generateContent(prompt);
                aiReport = JSON.parse(result.response.text());
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
        let aiAnalysis = {
            isVulnerable: 'Yes',
            severity: 'High',
            diagnosis: 'The server answered with 200 OK and allowed database payloads.',
            mitigation: 'Implement input sanitization and use parameterized ORMs.'
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
        You are a cybersecurity simulation analyst. Review the response to this safe penetration test probe.
        
        Attack Vector: ${attackType.toUpperCase()}
        Description: ${description}
        Target Tested URL: ${testUrl}
        Simulation Response Results: ${JSON.stringify(results)}

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
                aiAnalysis = JSON.parse(result.response.text());
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
};
exports.PlaygroundService = PlaygroundService;
exports.PlaygroundService = PlaygroundService = PlaygroundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], PlaygroundService);
//# sourceMappingURL=playground.service.js.map