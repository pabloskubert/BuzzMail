"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "fdsfds", { value: true });
const path = __importDefault(require('path'));
const figlet_1 = __importDefault(require(path.join(__dirname, 'node_modules', 'figlet')));
const chalk_1 = __importDefault(require("chalk"));
const autenticar_1 = __importDefault(require("./autenticar"));
const entrada_1 = __importDefault(require("./entrada"));
const mailerEnviar_1 = __importDefault(require("./mailerEnviar"));
figlet_1.default.text('MailerLag', (err, bundaseca) => {
    if (err)
        console.error(err.message);
    Main.printBanner(bundaseca);
    autenticar_1.default.aut();
});
class Main {
    static init() {
        const mailer = new entrada_1.default();
        mailer.coletarInfos()
            .then((config) => {
            new mailerEnviar_1.default(config);
        });
    }
    static printBanner(banner) {
        console.log(chalk_1.default.cyan.bold(banner));
        console.log(chalk_1.default.yellow.bold('Contato: pablo1920@protonmail.com'));
        console.log(chalk_1.default.redBright.bold('Cridor por @deeman - v0.0.9@Alpha'));
    }
}
exports.default = Main;
