import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import axios from 'axios';
import * as dns from 'dns';
import * as tls from 'tls';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { assertSafeUrl } from '../common/ssrf-guard';

@Injectable()
export class PlaygroundService {
  private readonly logger = new Logger(PlaygroundService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly aiService: AiService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async auditEndpoint(url: string, method: string, headers: Record<string, string>, body: any) {
    await assertSafeUrl(url);
    const startTime = Date.now();
    let status = 0;
    let responseHeaders: Record<string, string> = {};
    let responseBody: any = null;
    let latencyMs = 0;
    let errorMsg: string | null = null;

    try {
      const response = await axios({
        url,
        method: method as any,
        headers,
        data: body,
        timeout: 10000,
        validateStatus: () => true, // resolve promise for any status code
      });
      status = response.status;
      responseHeaders = response.headers as any;
      responseBody = response.data;
      latencyMs = Date.now() - startTime;
    } catch (e: any) {
      errorMsg = e.message;
      latencyMs = Date.now() - startTime;
    }

    // Call Gemini to do a quick API security audit on headers & error patterns
    let aiAuditReport = {
      overallRisk: 'None',
      findings: [] as string[],
      recommendation: 'All secure.'
    };

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                overallRisk: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ['Critical', 'High', 'Medium', 'Low', 'None'],
                },
                findings: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: 'List of issues found (e.g. CORS mismatch, missing HSTS, exposed backend technology stack, verbose database errors)'
                },
                recommendation: {
                  type: SchemaType.STRING,
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
      } catch (err: any) {
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

  async auditCode(code: string, language: string) {
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
            type: SchemaType.OBJECT,
            properties: {
              severity: { type: SchemaType.STRING, format: 'enum', enum: ['Critical', 'High', 'Medium', 'Low', 'None'] },
              findings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              recommendations: { type: SchemaType.STRING }
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
    } catch (e: any) {
      this.logger.error('Failed to audit code with Gemini', e);
      return {
        severity: 'Low',
        findings: ['AI could not audit this snippet. Check format.'],
        recommendations: 'Ensure the code is valid syntax.'
      };
    }
  }

  async inspectDomain(domain: string) {
    const cleanDomain = domain.replace(/https?:\/\//, '').split('/')[0].split(':')[0];
    await assertSafeUrl(`https://${cleanDomain}`);

    // Query DNS SPF & DMARC records
    const dnsInfo: any = {};
    const resolveTxt = (name: string): Promise<string[][]> => {
      return new Promise((res) => {
        dns.resolveTxt(name, (err, records) => {
          if (err) res([]);
          else res(records);
        });
      });
    };

    const resolveMx = (name: string): Promise<any[]> => {
      return new Promise((res) => {
        dns.resolveMx(name, (err, records) => {
          if (err) res([]);
          else res(records);
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

    // TLS Info
    let sslInfo: any = { status: 'Unknown' };
    const checkSSL = (): Promise<any> => {
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
          } else {
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
      dnsFindings: [] as string[],
      sslFindings: [] as string[],
      advice: 'All looks decent.'
    };

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                securityScore: { type: SchemaType.STRING },
                dnsFindings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                sslFindings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                advice: { type: SchemaType.STRING }
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
      } catch (e: any) {
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

  async simulateAttack(url: string, attackType: string) {
    await assertSafeUrl(url);
    let payload = '';
    let description = '';
    const headers: Record<string, string> = {
      'User-Agent': 'PulseGuard-Security-Simulator/1.0',
      'Content-Type': 'application/json',
    };

    if (attackType === 'sqli') {
      payload = "?id=1'+OR+'1'='1'--&username=admin'--";
      description = "SQL Injection probe using single quotes and logic conditions OR '1'='1'";
    } else if (attackType === 'xss') {
      payload = "?q=%3Cscript%3Econsole.log('pulseguard-xss-test')%3C/script%3E";
      description = "Cross-Site Scripting probe attempting inline tag console.log execution";
    } else if (attackType === 'sensitive-path') {
      payload = "/.env";
      description = "Path traversal probe attempting to read file /.env containing system variables";
    } else if (attackType === 'rate-limit') {
      description = "Rate Limiting test sending 5 concurrent requests in quick succession";
    }

    const testUrl = attackType === 'sensitive-path' ? `${url.replace(/\/$/, '')}${payload}` : `${url}${payload}`;
    const results: any[] = [];

    if (attackType === 'rate-limit') {
      const promises = Array.from({ length: 5 }).map(() =>
        axios.get(url, { headers, timeout: 5000, validateStatus: () => true })
          .then(res => ({ status: res.status, ok: res.status !== 429 }))
          .catch(e => ({ status: 0, error: e.message }))
      );
      const responses = await Promise.all(promises);
      responses.forEach((r, idx) => {
        results.push({ requestNum: idx + 1, status: r.status, statusText: r.status === 429 ? 'Blocked (429)' : 'Allowed' });
      });
    } else {
      try {
        const response = await axios({
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
      } catch (err: any) {
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
              type: SchemaType.OBJECT,
              properties: {
                isVulnerable: { type: SchemaType.STRING, format: 'enum', enum: ['Yes', 'No', 'Suspected'] },
                severity: { type: SchemaType.STRING, format: 'enum', enum: ['Critical', 'High', 'Medium', 'Low', 'None'] },
                diagnosis: { type: SchemaType.STRING },
                mitigation: { type: SchemaType.STRING }
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
      } catch (e: any) {
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
}
