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
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSafeUrl = assertSafeUrl;
const common_1 = require("@nestjs/common");
const url_1 = require("url");
const dns = __importStar(require("dns"));
const util_1 = require("util");
const resolve4 = (0, util_1.promisify)(dns.resolve4);
const resolve6 = (0, util_1.promisify)(dns.resolve6);
const PRIVATE_RANGES = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./,
    /^::1$/,
    /^fc[0-9a-f]{2}:/i,
    /^fe80:/i,
    /^0\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];
function isPrivateIp(ip) {
    return PRIVATE_RANGES.some(r => r.test(ip));
}
async function assertSafeUrl(rawUrl) {
    let parsed;
    try {
        parsed = new url_1.URL(rawUrl);
    }
    catch {
        throw new common_1.BadRequestException('Invalid URL format.');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new common_1.BadRequestException('Only http and https URLs are allowed.');
    }
    const hostname = parsed.hostname;
    const blockedHosts = ['169.254.169.254', 'metadata.google.internal', 'metadata.internal'];
    if (blockedHosts.includes(hostname.toLowerCase())) {
        throw new common_1.BadRequestException('URL resolves to a restricted address.');
    }
    if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
        if (isPrivateIp(hostname)) {
            throw new common_1.BadRequestException('Private or reserved IP addresses are not allowed.');
        }
        return;
    }
    const ips = [];
    try {
        const v4 = await resolve4(hostname).catch(() => []);
        const v6 = await resolve6(hostname).catch(() => []);
        ips.push(...v4, ...v6);
    }
    catch {
        return;
    }
    for (const ip of ips) {
        if (isPrivateIp(ip)) {
            throw new common_1.BadRequestException('URL resolves to a private network address.');
        }
    }
}
//# sourceMappingURL=ssrf-guard.js.map