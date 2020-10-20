import chalk from 'chalk';
import fs from 'fs';
import { Configuracao } from './entrada';
import Console from './console';
import NodeMailer from './engine/index';
import { setupMailer } from './engine/index';

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
            for (let login of arrayLogins) {
                
                const credencial = login.split(' ');
                console.log(chalk.green.bold('[+]')+'Lido '+chalk.red.bold(credencial[0])+' com senha ['+
                chalk.red.bold(credencial[1])+']');
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
