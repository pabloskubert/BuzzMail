import quest from 'prompts';
import ler from 'line-reader';
import nodemail,{ Transporter } from 'nodemailer';
import Console from '../console';
import logsimb from 'log-symbols';

export interface setupMailer {
    loginsEmail: Map<string | number, string>;
    emailUnico?: string;
    conteudoHTML: string;
    dirEmailsList: string;
    limite: number;
}

export default class NodeMailer {

    private readonly caminhoListaEmails: string;
    private readonly logins: Map<string | number, string>;
    private readonly loginUnico: string;
    private readonly pagHtml: string;
    private readonly loops: number;

    /* infos que serão enviadas */ 
    private assunto: string;
    private titulo: string;

    constructor(config: setupMailer) {

        this.caminhoListaEmails = config.dirEmailsList;
        this.logins = config.loginsEmail;
        this.pagHtml = config.conteudoHTML;

        this.loginUnico = (config.emailUnico !== undefined)
            ? config.emailUnico : 'n/a';
        this.assunto = '';
        this.titulo = '';

        this.loops = (config.limite === 0) 
            ? 500*this.logins.size
            : config.limite;
    }

    public iniciar(): void {
        this.perguntarInfos();
    }

    /* função master-blaster imperativa */
    private iniciarEnvios(): void {
        let processados = 0, aux = 1;
        let enviarCom: string[] = [];
        let transporte: Transporter;
        let linhasLidas = 0;

        const enviarPorVez = 5;
        if (this.logins.size <= 1) {
             enviarCom[0] = this.loginUnico;
             enviarCom[1] = this.logins.get(this.loginUnico) as string;
            
        } else enviarCom = this.logins.get(0)?.split(' ') as string[];

        transporte = this.preparar(enviarCom[0], enviarCom[1]);
        let emailsAlvo = new Array<string>();
        ler.eachLine(this.caminhoListaEmails, (linha) => {

            if (processados > this.loops) return false;
            if (processados === 500) {
                enviarCom = this.logins.get(aux++)?.split(' ') as string[];
                processados = 0;
                transporte = this.preparar(enviarCom[0], enviarCom[1]);
            } else processados += enviarPorVez;

            /* lê linha que esteja no formato: email,email,email */
            if (linha.includes(','))
                emailsAlvo.push(...linha.split(','));

            if (linhasLidas <= enviarPorVez && this.loops > enviarPorVez) {
                emailsAlvo.push(linha);
                linhasLidas++;
            } else {
                linhasLidas = 0;
                if (this.loops>1) {
                    Console.positivo(`De ${enviarCom[0]} para ${emailsAlvo[0]},${emailsAlvo[1]},${emailsAlvo[3]},${emailsAlvo[4]}`);
                } else {
                    Console.positivo(`De ${enviarCom[0]} para ${linha}`);
                }

                transporte.sendMail({
                    from: enviarCom[0],
                    to: (this.loops < enviarPorVez)?linha:emailsAlvo,
                    subject: this.assunto,
                    text: this.titulo,
                    html: this.pagHtml
                }, (err) => {
                    if (err) 
                        Console.negativo(`Erro ao enviar: ${err.message}`);
                    
                    console.log(logsimb.success, 'Enviado com sucesso!');
                    emailsAlvo = [];
                })
            }
        });
    }

    private preparar(email: string, senha: string): Transporter {
        return nodemail.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: senha
            }
        });
    }

    private async perguntarInfos(): Promise<void> {
        const resp1 = await quest({
            type: 'text',
            name: 'form',
            message: 'Titulo '
        });

        const resp2 = await quest({
            type: 'text',
            name: 'form',
            message: 'Assunto '
        });

        this.titulo = resp1.form;
        this.assunto = resp2.form;
        this.iniciarEnvios();
    }
}
