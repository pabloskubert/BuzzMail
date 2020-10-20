"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
class Console {
    static positivo(msg) {
        const pos = chalk_1.default.green.bold('[+] ');
        console.log(pos.concat(chalk_1.default.yellow.bold(msg, '\n')));
    }
    static negativo(msg) {
        const neg = chalk_1.default.red.bold('[-] ');
        console.log(neg.concat(chalk_1.default.yellow.bold(msg, '\n')));
    }
}
exports.default = Console;
