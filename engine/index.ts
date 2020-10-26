import quest from 'prompts';
import nodemail, { Transporter } from 'nodemailer';
import ler from 'line-reader';
import chalk from 'chalk';
import Console from '../console';

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
    private enviados: number;
    private enviosFalhos: number;
    private totalEnviados: number;
    private pararEnvio: boolean;

    /* infos que serão enviadas */
    private assunto: string;
    private titulo: string;

    constructor(config: setupMailer) {

        this.caminhoListaEmails = config.dirEmailsList;
        this.logins = config.loginsEmail;
        this.pagHtml = config.conteudoHTML;
        this.pararEnvio = false;
        this.enviados = 0;
        this.enviosFalhos = 0;
        this.totalEnviados = 0;

        this.loginUnico = (config.emailUnico !== undefined)
            ? config.emailUnico : 'n/a';
        this.assunto = '';
        this.titulo = '';

        this.loops = (config.limite === 0)
            ? 500 * this.logins.size
            : config.limite;

        process.once('SIGINT', this.resultados.bind(this));
        process.once('exit', this.resultados.bind(this));
    }

    public iniciar(): void {
        this.perguntarInfos();
    }

    private abortar(estado: { value: string, aborted: boolean }): void {
        if (estado.aborted) {
            console.log('\n');
            Console.negativo('Saindo...\n');
            process.exit(0);
        }
    }

    private resultados(sinal: unknown) {
        this.pararEnvio = true;
        const pcrt = (this.enviados/this.totalEnviados)*100;
        console.log('\t\n' +chalk.green('->')+chalk.yellow(' Aproveitamento de '),
        chalk.green(pcrt+'% ')+', '+chalk.white(this.enviados),chalk.yellow(' foram enviados com ', chalk.green('sucesso ')),
            chalk.yellow('e '), chalk.red(this.enviosFalhos), chalk.yellow(' falharam.'));
        
        console.log(chalk.red('\n\nTrabalho feito feche esta janela.\n\n'));
        while (true) {}
    }

    /* função master-blaster imperativa */
    private iniciarEnvios(): void {
        let processados = 0, aux = 1;
        let enviarCom: string[] = [];
        let transporte: Transporter;
        let linhasLidas = 0;
        let maisDeUmEmail = false;

        const enviarPorVez = 5;
        if (this.logins.size === 1) {
            enviarCom[0] = this.loginUnico;
            enviarCom[1] = this.logins.get(this.loginUnico) as string;

        } else enviarCom = this.logins.get(0)?.split(' ') as string[];
        
        transporte = this.preparar(enviarCom[0], enviarCom[1]);
        let emailsAlvo = new Array<string>();
        ler.eachLine(this.caminhoListaEmails, (linha) => {
            if (processados > this.loops) return false;

            /* Usuário apertou CRTL+C -> PARAR */
            
            if (this.pararEnvio) return false;

            if (processados === 500) {
                enviarCom = this.logins.get(aux++)?.split(' ') as string[];
                processados = 0;
                transporte = this.preparar(enviarCom[0], enviarCom[1]);
            }

            /* lê linha que esteja no formato: email,email,email */
            if (linha.includes(',')) {
                emailsAlvo.push(...linha.split(','));
                linhasLidas += emailsAlvo.length;
                maisDeUmEmail = true;
            }

            if (linhasLidas <= enviarPorVez && !maisDeUmEmail) {
                emailsAlvo.push(linha);
                linhasLidas++;
            } else {
                linhasLidas = 0;
                maisDeUmEmail = false;
                const enviarPara = emailsAlvo;
                emailsAlvo = [];
                processados += enviarPara.length;

                if (this.loops > 1) {
                    let logStr = chalk.green('[+]')+chalk.yellow('De ')+chalk.magenta(enviarCom[0])+chalk.yellow(' para ');
                    let i = 1;
                    for (let email of enviarPara) {
                       logStr = logStr.concat(chalk.cyan(email));
                        
                       if (i !== emailsAlvo.length)
                           logStr = logStr.concat(chalk.green(','));
                       i++;
                    }
                    console.log(logStr);
                } else {
                    console.log(chalk.green('[+] '),
                        chalk.yellow('De '), chalk.magenta(enviarCom[0]), chalk.yellow(' para '),
                        chalk.cyan(enviarPara[0]));
                }

                transporte.sendMail({
                    from: enviarCom[0],
                    to: (this.loops < enviarPorVez) ? linha : enviarPara,
                    subject: this.assunto,
                    text: this.titulo,
                    html: this.pagHtml
                }, (err) => {
                    if (err) {
                        Console.negativo(`Erro ao enviar: ${err.message}`);
                        this.enviosFalhos += enviarPara.length;
                    } else {
                        this.enviados += enviarPara.length;
                    }
                    this.totalEnviados += enviarPara.length;
                });
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
        let prosseguir = false;
        let resp1 = { form: 'n/a' }, resp2 = { form: 'n/a' };

        const validar = (infoEnviar: string): boolean | string => {
            return (infoEnviar === undefined || infoEnviar === '')
                ? 'Esse campo não pode ser vazio!'
                : true
        }

        while (!prosseguir) {
            console.log('\n');
            resp1 = await quest({
                type: 'text',
                name: 'form',
                message: 'Titulo ',
                validate: validar,
                onState: this.abortar
            });

            console.log('\n');
            resp2 = await quest({
                type: 'text',
                name: 'form',
                message: 'Assunto ',
                validate: validar,
                onState: this.abortar
            });

            const infos = await quest({
                type: 'toggle',
                name: 'incorreto',
                inactive: 'Sim',
                active: 'não',
                initial: false,
                onState: this.abortar,
                message: `${chalk.yellow('O assunto ')}${chalk.red('[')}${chalk.white(`${resp2.form}`)}${chalk.red(']')}${chalk.yellow(' e o titulo ')}${chalk.red('[')}${chalk.white(`${resp1.form}`)}${chalk.red(']')}${chalk.yellow(' estão corretos')}`
            });

            prosseguir = !infos.incorreto;
        }
        this.titulo = resp1.form;
        this.assunto = resp2.form;
        this.iniciarEnvios();
    }
}
