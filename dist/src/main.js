"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    process.exit(1);
});
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
        .split(',')
        .map(o => o.trim());
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        allowedHeaders: ['Content-Type', 'Authorization', 'x-github-token', 'x-github-event'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api', { exclude: ['health'] });
    const port = process.env.PORT ?? 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`Application listening on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map