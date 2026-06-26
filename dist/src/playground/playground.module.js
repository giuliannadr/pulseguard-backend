"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaygroundModule = void 0;
const common_1 = require("@nestjs/common");
const playground_controller_1 = require("./playground.controller");
const playground_service_1 = require("./playground.service");
const ai_module_1 = require("../ai/ai.module");
const checker_module_1 = require("../checker/checker.module");
let PlaygroundModule = class PlaygroundModule {
};
exports.PlaygroundModule = PlaygroundModule;
exports.PlaygroundModule = PlaygroundModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule, checker_module_1.CheckerModule],
        controllers: [playground_controller_1.PlaygroundController],
        providers: [playground_service_1.PlaygroundService],
    })
], PlaygroundModule);
//# sourceMappingURL=playground.module.js.map