"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = __importDefault(require("prompts"));
const line_reader_1 = __importDefault(require("line-reader"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const console_1 = __importDefault(require("../console"));
const log_symbols_1 = __importDefault(require("log-symbols"));
class NodeMailer {
    constructor(config) {
        this.caminhoListaEmails = config.dirEmailsList;
        this.logins = config.loginsEmail;
        this.pagHtml = config.conteudoHTML;
        this.loginUnico = (config.emailUnico !== undefined)
            ? config.emailUnico : 'n/a';
        this.assunto = '';
        this.titulo = '';
        this.loops = (config.limite === 0)
            ? 500 * this.logins.size
            : config.limite;
    }
    iniciar() {
        this.perguntarInfos();
    }
    iniciarEnvios() {
        var _a;
        let processados = 0, aux = 1;
        let enviarCom = [];
        let transporte;
        let linhasLidas = 0;
        const enviarPorVez = 5;
        if (this.logins.size <= 1) {
            enviarCom[0] = this.loginUnico;
            enviarCom[1] = this.logins.get(this.loginUnico);
        }
        else
            enviarCom = (_a = this.logins.get(0)) === null || _a === void 0 ? void 0 : _a.split(' ');
        transporte = this.preparar(enviarCom[0], enviarCom[1]);
        let emailsAlvo = new Array();
        line_reader_1.default.eachLine(this.caminhoListaEmails, (linha) => {
            var _a;
            if (processados > this.loops)
                return false;
            if (processados === 500) {
                enviarCom = (_a = this.logins.get(aux++)) === null || _a === void 0 ? void 0 : _a.split(' ');
                processados = 0;
                transporte = this.preparar(enviarCom[0], enviarCom[1]);
            }
            else
                processados += enviarPorVez;
            if (linha.includes(','))
                emailsAlvo.push(...linha.split(','));
            if (linhasLidas <= enviarPorVez && this.loops > enviarPorVez) {
                emailsAlvo.push(linha);
                linhasLidas++;
            }
            else {
                linhasLidas = 0;
                if (this.loops > 1) {
                    console_1.default.positivo(`De ${enviarCom[0]} para ${emailsAlvo[0]},${emailsAlvo[1]},${emailsAlvo[3]},${emailsAlvo[4]}`);
                }
                else {
                    console_1.default.positivo(`De ${enviarCom[0]} para ${linha}`);
                }
                transporte.sendMail({
                    from: enviarCom[0],
                    to: (this.loops < enviarPorVez) ? linha : emailsAlvo,
                    subject: this.assunto,
                    text: this.titulo,
                    html: this.pagHtml
                }, (err) => {
                    if (err)
                        console_1.default.negativo(`Erro ao enviar: ${err.message}`);
                    console.log(log_symbols_1.default.success, 'Enviado com sucesso!');
                    emailsAlvo = [];
                });
            }
        });
    }
    preparar(email, senha) {
        return nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: senha
            }
        });
    }
    async perguntarInfos() {
        const resp1 = await prompts_1.default({
            type: 'text',
            name: 'form',
            message: 'Titulo '
        });
        const resp2 = await prompts_1.default({
            type: 'text',
            name: 'form',
            message: 'Assunto '
        });
        this.titulo = resp1.form;
        this.assunto = resp2.form;
        this.iniciarEnvios();
    }
}
exports.default = NodeMailer;
