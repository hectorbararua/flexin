"use strict";
/**
 * Types and interfaces for Selfbot Manager
 * Following Interface Segregation Principle (ISP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MANAGER_CONFIG = exports.OperationResult = exports.SelfbotStatus = void 0;
// ============================================
// ENUMS
// ============================================
var SelfbotStatus;
(function (SelfbotStatus) {
    SelfbotStatus["OFFLINE"] = "offline";
    SelfbotStatus["ONLINE"] = "online";
    SelfbotStatus["CONNECTING"] = "connecting";
    SelfbotStatus["ERROR"] = "error";
})(SelfbotStatus || (exports.SelfbotStatus = SelfbotStatus = {}));
var OperationResult;
(function (OperationResult) {
    OperationResult["SUCCESS"] = "success";
    OperationResult["FAILURE"] = "failure";
    OperationResult["SKIPPED"] = "skipped";
    OperationResult["RATE_LIMITED"] = "rate_limited";
})(OperationResult || (exports.OperationResult = OperationResult = {}));
exports.DEFAULT_MANAGER_CONFIG = {
    delayBetweenAccounts: 2000,
    delayBetweenOperations: 1000,
    maxRetries: 3,
    reconnectDelay: 5000
};
