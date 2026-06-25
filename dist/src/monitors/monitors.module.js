"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorsModule = void 0;
const common_1 = require("@nestjs/common");
const monitors_service_1 = require("./monitors.service");
const monitors_controller_1 = require("./monitors.controller");
const security_incidents_controller_1 = require("./security-incidents.controller");
const checker_module_1 = require("../checker/checker.module");
const github_module_1 = require("../github/github.module");
let MonitorsModule = class MonitorsModule {
};
exports.MonitorsModule = MonitorsModule;
exports.MonitorsModule = MonitorsModule = __decorate([
    (0, common_1.Module)({
        imports: [checker_module_1.CheckerModule, github_module_1.GithubModule],
        controllers: [monitors_controller_1.MonitorsController, security_incidents_controller_1.SecurityIncidentsController],
        providers: [monitors_service_1.MonitorsService],
        exports: [monitors_service_1.MonitorsService],
    })
], MonitorsModule);
//# sourceMappingURL=monitors.module.js.map