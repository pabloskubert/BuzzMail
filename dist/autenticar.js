"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = __importDefault(require("prompts"));
const index_1 = __importDefault(require("./index"));
class Autenticar {
    static aut() {
        console.log('\n\n');
        prompts_1.default({
            type: 'password',
            name: 'pass',
            message: 'Digite o serial para ativar',
            validate: (userInput) => {
                return (userInput === 'root')
                    ? true
                    : 'Serial invalído';
            }
        }).then(() => {
            index_1.default.init();
        });
    }
}
exports.default = Autenticar;
