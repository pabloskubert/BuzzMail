"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const console_1 = __importDefault(require("./console"));
const index_1 = __importDefault(require("./engine/index"));
class IniciarEnvio {
    constructor(cnf) {
        this.credenciais_login = new Map();
        let emailUnico = 'n/a';
        if (!cnf.carregarLogins) {
            console_1.default.positivo(`Usando o email -> ${cnf.txtOuEmail}`);
            this.credenciais_login.set(cnf.txtOuEmail, (cnf.senhaEmail !== undefined)
                ? cnf.senhaEmail : '');
            emailUnico = cnf.txtOuEmail;
        }
        else {
            console_1.default.positivo(`Lendo o arquivo ${cnf.txtOuEmail}`);
            const arqLido = fs_1.default.readFileSync(cnf.txtOuEmail);
            const strLogins = arqLido.toString();
            const arrayLogins = strLogins.split('\n');
            let i = 0;
            for (let login of arrayLogins) {
                const credencial = login.split(' ');
                console.log(chalk_1.default.green.bold('[+]') + 'Lido ' + chalk_1.default.red.bold(credencial[0]) + ' com senha [' +
                    chalk_1.default.red.bold(credencial[1]) + ']');
                this.credenciais_login.set(i++, login);
            }
        }
        console_1.default.positivo(`Lendo o arquivo html ${cnf.dirHtml}`);
        this.paginaHTML = fs_1.default.readFileSync(cnf.dirHtml).toString();
        const mailerEngine = new index_1.default({
            conteudoHTML: this.paginaHTML,
            loginsEmail: this.credenciais_login,
            dirEmailsList: cnf.emailsCaminho,
            limite: cnf.limiteEnvios,
            emailUnico: emailUnico
        }).iniciar();
    }
}
exports.default = IniciarEnvio;
