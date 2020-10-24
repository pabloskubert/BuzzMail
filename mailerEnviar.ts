import chalk from 'chalk';
import fs from 'fs';
import { Configuracao } from './entrada';
import Console from './console';
import NodeMailer from './engine/index';

export default class IniciarEnvio {

    private credenciais_login: Map<number | string, string>;
    private paginaHTML: string;

    constructor(cnf: Configuracao) {
        
        this.credenciais_login = new Map<number,string>();
        let emailUnico = 'n/a';
        if (!cnf.carregarLogins) {

            Console.positivo(`Usando o email -> ${cnf.txtOuEmail}`);
            this.credenciais_login.set(cnf.txtOuEmail, (cnf.senhaEmail !== undefined)
            ? cnf.senhaEmail : '');
            emailUnico = cnf.txtOuEmail;
        } else {

            Console.positivo(`Lendo o arquivo ${cnf.txtOuEmail}`);
            const arqLido = fs.readFileSync(cnf.txtOuEmail);
            const strLogins = arqLido.toString();
            const arrayLogins = strLogins.split('\n');

            let i = 0;
            console.log('\n');
            for (let login of arrayLogins) {
                
                const credencial = login.split(' ');
                if (
                    credencial[0] === undefined ||
                    credencial[1] === undefined
                ) {
                    Console.negativo(`Erro na ${i+1}º linha do arquivo ${cnf.txtOuEmail}`);
                    Console.positivo(`Dica \n \t O arquivo deve conter em uma única linha o email e senha para login \n \t exemplo: fulano@gmail.com bolsolixo onde 'bolsolixo' é a senha e na próxima linha a mesma coisa.`)
                    Console.positivo(`Efetue a correção e tente novamente.`);
                    process.exit(0);
                }

                console.log(`${chalk.green('[+]')} Login detectado: ${chalk.cyan(credencial[0])} com senha ${chalk.yellow(credencial[1])}`);
                this.credenciais_login.set(i++, login);
            }
        }

        Console.positivo(`Lendo o arquivo html ${cnf.dirHtml}`);
        this.paginaHTML = fs.readFileSync(cnf.dirHtml).toString();

        const mailerEngine = new NodeMailer({
            conteudoHTML: this.paginaHTML,
            loginsEmail: this.credenciais_login,
            dirEmailsList: cnf.emailsCaminho,
            limite: cnf.limiteEnvios as number,
            emailUnico: emailUnico
        }).iniciar();
    }
}
