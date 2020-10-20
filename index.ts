import figlet from 'figlet';
import chalk from 'chalk';
import MailerLag, { Configuracao } from './entrada';
import Autenticar from './autenticar';
import IniciarEnvio from './mailerEnviar';
import Console from './console';

figlet.text('MailerLag', (err, banner) => {
    if (err)
        console.error(err.message);
    
    Main.printBanner(banner as string);
    Autenticar.aut();
});

process.once('SIGINT', (sig) => {
    Console.negativo(' Saindo...');
    process.exit(0);
});

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
        console.log(chalk.yellow.bold('Contato: pablo1920@protonmail.com'));
        console.log(chalk.redBright.bold('Cridor por @deeman - v0.0.9@Alpha'));
    }
}
