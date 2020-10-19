import quest from 'prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Configuracao {
    carregarLogins: boolean;
    txtOuEmail: string;
    limiteEnvios?: number;
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

        const resp2 = await quest({
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

        const resp3 = await quest({
            type: 'confirm',
            name: 'limitar',
            message: 'Deseja limitar o número de e-mails a serem enviados',
            initial: false
        });

        let limiteEnvios = 500;
        if (resp3.limitar) {
            const li = await quest({
                type: 'number',
                name: 'limite',
                message: 'Limitar em'
            });

            limiteEnvios = li.limite;
        }
        const txtOuEmail: string = resp2.enviarUsando;
        console.log('\n\n');
        const tipo = await quest({
            type: 'text',
            name: 'enviar',
            message: 'Diretório do arquivo html para envio',
            validate: (arquivoDir: string): boolean | string => {
                if (!fs.existsSync(arquivoDir)) {
                    this.buscarHtmlEm.forEach((usuarioDir) => {

                        const arq = path.join(this.ambiente, usuarioDir + path.sep + arquivoDir);
                        if (fs.existsSync(arq)) return true;
                    });
                } else return true;

                return `Arquivo ${arquivoDir} não encontrado`;
            }
        });

        const dirHtml = tipo.enviar;
        return { carregarLogins, txtOuEmail, limiteEnvios, dirHtml };
    }
}