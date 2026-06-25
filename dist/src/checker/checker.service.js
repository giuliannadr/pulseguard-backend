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
var CheckerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckerService = void 0;
const common_1 = require("@nestjs/common");
const tls = __importStar(require("tls"));
let CheckerService = CheckerService_1 = class CheckerService {
    logger = new common_1.Logger(CheckerService_1.name);
    async checkUrl(url, expectedStatus, expectedText) {
        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15_000);
            const response = await fetch(url, {
                signal: controller.signal,
                redirect: 'follow',
            });
            clearTimeout(timeout);
            const responseTimeMs = Date.now() - start;
            const statusCode = response.status;
            const body = expectedText ? await response.text() : null;
            const statusOk = statusCode === expectedStatus;
            const textOk = expectedText
                ? (body?.includes(expectedText) ?? false)
                : true;
            const sslDaysLeft = url.startsWith('https')
                ? await this.getSslDaysLeft(url)
                : null;
            let status;
            if (!statusOk || !textOk) {
                status = 'down';
            }
            else if (responseTimeMs > 3000) {
                status = 'degraded';
            }
            else {
                status = 'up';
            }
            return {
                status,
                statusCode,
                responseTimeMs,
                sslDaysLeft,
                errorMessage: null,
            };
        }
        catch (err) {
            const responseTimeMs = Date.now() - start;
            const isTimeout = err?.name === 'AbortError';
            return {
                status: 'down',
                statusCode: null,
                responseTimeMs,
                sslDaysLeft: null,
                errorMessage: isTimeout
                    ? 'Request timed out after 15s'
                    : String(err?.message ?? err),
            };
        }
    }
    async getSslDaysLeft(url) {
        return new Promise((resolve) => {
            try {
                const { hostname } = new URL(url);
                const socket = tls.connect({ host: hostname, port: 443, servername: hostname }, () => {
                    const cert = socket.getPeerCertificate();
                    socket.destroy();
                    if (!cert?.valid_to)
                        return resolve(null);
                    const expiresAt = new Date(cert.valid_to);
                    const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    resolve(daysLeft);
                });
                socket.on('error', () => resolve(null));
                socket.setTimeout(5000, () => {
                    socket.destroy();
                    resolve(null);
                });
            }
            catch {
                resolve(null);
            }
        });
    }
};
exports.CheckerService = CheckerService;
exports.CheckerService = CheckerService = CheckerService_1 = __decorate([
    (0, common_1.Injectable)()
], CheckerService);
//# sourceMappingURL=checker.service.js.map