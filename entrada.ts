import quest from 'prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Console from './console';

export interface Configuracao {
    carregarLogins: boolean;
    emailsCaminho: string;
    txtOuEmail: string;
    limiteEnvios?: number;
    senhaEmail?: string;
    dirHtml: string;
}

type ON_STATE = { value: string, aborted: boolean }
export default class Mailer {

    private readonly emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    private readonly ambiente = os.homedir();
    private encontrarEm: string = '';
    private readonly buscarHtmlEm = [
        "Desktop", "Documents", "Images", "Downloads"
    ];

    /* verifica a sequência CRTL+C foi disparada */
    private readonly verificarPulo = function(estado: ON_STATE) {
        if (estado.aborted) {
            console.log('\n');
            Console.negativo('Saindo...\n');
            process.exit(0);
        }
    }

    public async coletarInfos(): Promise<Configuracao> {
        const resp1 = await quest({
            type: 'confirm',
            name: 'usarVarios',
            message: 'Carregar arquivo .txt com logins gmail',
            initial: true,
            onState: this.verificarPulo
        });
        const carregarLogins: boolean = resp1.usarVarios;
        console.log('\n');
        const validar = (entrada: string, validarEmail?: boolean): boolean | string => {
            if (entrada === undefined || entrada === '')
                return 'Preencha este campo.';
                
            /* validação do e-mail */
            if (validarEmail !== undefined) {
                if  (this.emailRegex.test(entrada)) {
                    this.encontrarEm = entrada;
                    return true;
                } else return 'Formato de e-mail inválido.';
            }

            if (!fs.existsSync(entrada)) {
                let existe: boolean = false;

                this.buscarHtmlEm.forEach((usuarioDir) => {
                    const arq = path.join(this.ambiente, usuarioDir, entrada);
                    if (fs.existsSync(arq)) {
                        existe = true;
                        this.encontrarEm = arq;
                    }
                });

                if (!existe) {
                    return `Arquivo ${entrada} não encontrado`;
                } else return true;
            } else return true;
        }

        const perg: Array<quest.PromptObject> = [];
        perg.push({
            type: 'text',
            name: 'enviarUsando',
            message: (carregarLogins) ? 'Caminho ou nome do arquivo com os logins(gmail)' : 'Conta de e-mail que irá enviar os emails',
            validate: (i: string): boolean | string => {
                return (!carregarLogins)
                    ? validar(i, true)
                    : validar(i);
            },
            onState: this.verificarPulo
        });

        if (!carregarLogins) {
            const pedirSenha: quest.PromptObject = {
                type: 'password',
                name: 'credencial',
                message: 'Senha',
                onState: this.verificarPulo
            };

            perg.push(pedirSenha);
        }

        const resp2 = await quest(perg);
        const txtOuEmail: string = this.encontrarEm;
        console.log('\n');
        const resp3 = await quest({
            type: 'confirm',
            name: 'limitar',
            message: 'Deseja limitar o número de e-mails a serem enviados',
            initial: false,
            onState: this.verificarPulo
        });

        const senhaEmail = (resp2.credencial !== undefined)?resp2.credencial:'';
        console.log('\n');
        let limiteEnvios = 500;
        if (resp3.limitar) {
            const li = await quest({
                type: 'number',
                name: 'limite',
                message: 'Limitar em',
                onState: this.verificarPulo,
                validate: (n) => (n==0 || n===undefined)
                    ? 'O número deve ser maior que zero'
                    : true
            });

            limiteEnvios = li.limite;
        }

        await quest({
            type: 'text',
            name: 'enviar',
            message: 'Caminho do arquivo html ou nome para envio',
            validate: (i) => validar(i),
            onState: this.verificarPulo
        });

        const dirHtml: string = this.encontrarEm;
        console.log('\n');
        await quest({
            type: 'text',
            name: 'dir',
            message: 'Caminho ou nome do arquivo .txt contendo os emails alvos',
            validate: (i) => validar(i),
            onState: this.verificarPulo
        });
        const emailsCaminho:string = this.encontrarEm;
        return { carregarLogins, txtOuEmail, limiteEnvios, dirHtml, senhaEmail, emailsCaminho};
    }
}