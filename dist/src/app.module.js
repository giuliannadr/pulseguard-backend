"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const health_controller_1 = require("./health.controller");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const monitors_module_1 = require("./monitors/monitors.module");
const checker_module_1 = require("./checker/checker.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
const github_module_1 = require("./github/github.module");
const ai_module_1 = require("./ai/ai.module");
const playground_module_1 = require("./playground/playground.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [health_controller_1.HealthController],
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            checker_module_1.CheckerModule,
            monitors_module_1.MonitorsModule,
            scheduler_module_1.SchedulerModule,
            github_module_1.GithubModule,
            ai_module_1.AiModule,
            playground_module_1.PlaygroundModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map