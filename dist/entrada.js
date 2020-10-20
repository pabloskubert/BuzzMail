"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = __importDefault(require("prompts"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class Mailer {
    constructor() {
        this.emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        this.ambiente = os_1.default.homedir();
        this.buscarHtmlEm = [
            "Desktop", "Documents", "Images", "Downloads"
        ];
    }
    async coletarInfos() {
        const resp1 = await prompts_1.default({
            type: 'confirm',
            name: 'usarVarios',
            message: 'Carregar arquivo .txt com logins de e-mail para o envio em massa',
            initial: true
        });
        console.log('\n');
        const carregarLogins = resp1.usarVarios;
        const perg = [];
        perg.push({
            type: 'text',
            name: 'enviarUsando',
            message: (carregarLogins) ? 'Caminho para lista de E-mails' : 'Conta de e-mail que irá enviar os emails',
            validate: (entrada) => {
                if (carregarLogins) {
                    const existe = fs_1.default.existsSync(entrada);
                    if (!existe)
                        return `Arquivo .txt não encontrado em ${entrada}`;
                    return existe;
                }
                else {
                    return (this.emailRegex.test(entrada))
                        ? true
                        : `O e-mail ${entrada} não é um email válido`;
                }
            }
        });
        if (!carregarLogins) {
            const pedirSenha = {
                type: 'password',
                name: 'credencial',
                message: 'Senha'
            };
            perg.push(pedirSenha);
        }
        const resp2 = await prompts_1.default(perg);
        const resp3 = await prompts_1.default({
            type: 'confirm',
            name: 'limitar',
            message: 'Deseja limitar o número de e-mails a serem enviados',
            initial: false
        });
        const senhaEmail = (resp2.credencial !== undefined) ? resp2.credencial : '';
        let limiteEnvios = 500;
        if (resp3.limitar) {
            const li = await prompts_1.default({
                type: 'number',
                name: 'limite',
                message: 'Limitar em'
            });
            limiteEnvios = li.limite;
        }
        let encontrarEm = 'n/a';
        const validar = (arquivoDir) => {
            if (!fs_1.default.existsSync(arquivoDir)) {
                let existe = false;
                this.buscarHtmlEm.forEach((usuarioDir) => {
                    const arq = path_1.default.join(this.ambiente, usuarioDir, arquivoDir);
                    if (fs_1.default.existsSync(arq)) {
                        existe = true;
                        encontrarEm = arq;
                    }
                });
                if (!existe) {
                    return `Arquivo ${arquivoDir} não encontrado`;
                }
                else
                    return true;
            }
            else
                return true;
        };
        const txtOuEmail = resp2.enviarUsando;
        console.log('\n\n');
        await prompts_1.default({
            type: 'text',
            name: 'enviar',
            message: 'Caminho do arquivo html ou nome para envio',
            validate: validar
        });
        const dirHtml = encontrarEm;
        await prompts_1.default({
            type: 'text',
            name: 'dir',
            message: 'Caminho do arquivo .txt contendo os emails alvos',
            validate: validar
        });
        const emailsCaminho = encontrarEm;
        return { carregarLogins, txtOuEmail, limiteEnvios, dirHtml, senhaEmail, emailsCaminho };
    }
}
exports.default = Mailer;
