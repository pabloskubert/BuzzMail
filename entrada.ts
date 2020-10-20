import quest from 'prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import prompts from 'prompts';

export interface Configuracao {
    carregarLogins: boolean;
    emailsCaminho: string;
    txtOuEmail: string;
    limiteEnvios?: number;
    senhaEmail?: string;
    dirHtml: string;
}

export default class Mailer {

    private readonly emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    private readonly ambiente = os.homedir();
    private readonly buscarHtmlEm = [
        "Desktop", "Documents", "Images", "Downloads"
    ]

    public async coletarInfos(): Promise<Configuracao> {
        const resp1 = await quest({
            type: 'confirm',
            name: 'usarVarios',
            message: 'Carregar arquivo .txt com logins de e-mail para o envio em massa',
            initial: true
        });

        console.log('\n');
        const carregarLogins: boolean = resp1.usarVarios;

        const perg: Array<prompts.PromptObject> = [];
        perg.push({
            type: 'text',
            name: 'enviarUsando',
            message: (carregarLogins) ? 'Caminho para lista de E-mails' : 'Conta de e-mail que irá enviar os emails',
            validate: (entrada: string): boolean | string => {
                if (carregarLogins) {
                    const existe = fs.existsSync(entrada);
                    if (!existe) return `Arquivo .txt não encontrado em ${entrada}`;

                    return existe;
                } else {
                    return (this.emailRegex.test(entrada))
                        ? true
                        : `O e-mail ${entrada} não é um email válido`
                }
            }
        });

        if (!carregarLogins) {
            const pedirSenha: prompts.PromptObject = {
                type: 'password',
                name: 'credencial',
                message: 'Senha'
            };

            perg.push(pedirSenha);
        }

        const resp2 = await quest(perg);
        const resp3 = await quest({
            type: 'confirm',
            name: 'limitar',
            message: 'Deseja limitar o número de e-mails a serem enviados',
            initial: false
        });

        const senhaEmail = (resp2.credencial !== undefined)?resp2.credencial:'';
        let limiteEnvios = 500;
        if (resp3.limitar) {
            const li = await quest({
                type: 'number',
                name: 'limite',
                message: 'Limitar em'
            });

            limiteEnvios = li.limite;
        }

        let encontrarEm = 'n/a';
        const validar = (arquivoDir: string): boolean | string => {
            if (!fs.existsSync(arquivoDir)) {
                let existe: boolean = false;

                this.buscarHtmlEm.forEach((usuarioDir) => {
                    const arq = path.join(this.ambiente, usuarioDir, arquivoDir);
                    if (fs.existsSync(arq)) {
                        existe = true;
                        encontrarEm = arq;
                    }
                });

                if (!existe) {
                    return `Arquivo ${arquivoDir} não encontrado`;
                } else return true;
            } else return true;
        }
        
        const txtOuEmail: string = resp2.enviarUsando;
        console.log('\n\n');
        await quest({
            type: 'text',
            name: 'enviar',
            message: 'Caminho do arquivo html ou nome para envio',
            validate: validar
        });

        const dirHtml = encontrarEm;
        await quest({
            type: 'text',
            name: 'dir',
            message: 'Caminho do arquivo .txt contendo os emails alvos',
            validate: validar
        });

        const emailsCaminho = encontrarEm;
        return { carregarLogins, txtOuEmail, limiteEnvios, dirHtml, senhaEmail, emailsCaminho};
    }
}