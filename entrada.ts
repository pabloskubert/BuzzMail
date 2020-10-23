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

let encontrarEm = 'n/a';
export default class Mailer {

    private readonly emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    private readonly ambiente = os.homedir();
    private readonly buscarHtmlEm = [
        "Desktop", "Documents", "Images", "Downloads"
    ];

    private readonly sair = () => {
        Console.negativo('Saindo...');
        process.exit(0);
    }

    public async coletarInfos(): Promise<Configuracao> {
        const resp1 = await quest({
            type: 'confirm',
            name: 'usarVarios',
            message: 'Carregar arquivo .txt com logins de e-mail para o envio em massa',
            initial: true
        });
        if (resp1.usarVarios === undefined) this.sair();

        const carregarLogins: boolean = resp1.usarVarios;
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

        const perg: Array<quest.PromptObject> = [];
        perg.push({
            type: 'text',
            name: 'enviarUsando',
            message: (carregarLogins) ? 'Caminho para lista de E-mails' : 'Conta de e-mail que irá enviar os emails',
            validate: validar
        });

        if (!carregarLogins) {
            const pedirSenha: quest.PromptObject = {
                type: 'password',
                name: 'credencial',
                message: 'Senha'
            };

            perg.push(pedirSenha);
        }

        const resp2 = await quest(perg);
        if (resp2.enviarUsando === undefined) this.sair();

        const resp3 = await quest({
            type: 'confirm',
            name: 'limitar',
            message: 'Deseja limitar o número de e-mails a serem enviados',
            initial: false,
        });

        if (resp3 === undefined) this.sair();
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

        const txtOuEmail: string = encontrarEm;
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
            message: 'Caminho ou nome do arquivo .txt contendo os emails alvos',
            validate: validar
        });

        const emailsCaminho = encontrarEm;
        return { carregarLogins, txtOuEmail, limiteEnvios, dirHtml, senhaEmail, emailsCaminho};
    }
}