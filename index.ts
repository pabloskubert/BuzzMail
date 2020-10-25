import figlet from 'figlet';
import chalk from 'chalk';
import MailerLag, { Configuracao } from './entrada';
import Autenticar from './autenticar';
import IniciarEnvio from './mailerEnviar';

const VERSAO_ATUAL = '1.0.3';
figlet.text('MailerLag', (err, banner) => {
    if (err)
        console.error(err.message);
    
    Main.printBanner(banner as string);
    Autenticar.aut();
});

const sairMsg = function MesagemAoSair() {
    console.log('\n',chalk.redBright('[-]'), chalk.yellow.bold('Saindo...'), '\n');
    process.exit(0);
}

process.once('SIGINT', sairMsg);
export default class Main {
    public static init(): void {
        
        const mailer = new MailerLag();
        mailer.coletarInfos()

            .then((config: Configuracao) => {
                new IniciarEnvio(config);
            });
    }

    public static printBanner(banner: string): void {
        console.log(chalk.cyan.bold(banner));
        console.log('\n');
        console.log(chalk.yellow.bold('\tContato: pablo1920@protonmail.com'));
        console.log(chalk.redBright.bold('\tCriado por @deeman - v'+VERSAO_ATUAL+'@STABLE'));
    }
}
