import figlet from 'figlet';
import chalk from 'chalk';
import MailerLag, { Configuracao } from './entrada';
import Autenticar from './autenticar';
import IniciarEnvio from './mailerEnviar';

const VERSAO_ATUAL = '1.0.4';
const figletOptions: figlet.Options = { 
    horizontalLayout: 'full',
    verticalLayout: 'full'
}

figlet.text('BuzzMail', figletOptions, (err, banner) => {
    if (err)
        console.error(err.message);
    
    Main.printBanner(banner as string);
    Main.init(); // comente esta linha, se quiser ativar o sistema de login
    
    /* Como esse script não está mais à venda
       não é necessário ativar o sistema de login/cadastro
       Se você quer ver esse sistema em ação, retire o comentário 
       e ative o servidor: node backendNode\index.js */
    //Autenticar.aut();
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
        console.log('\n');
        console.log(chalk.yellow.bold('\tContato: pablo1920@protonmail.com'));
        console.log(chalk.redBright.bold('\tCriado por @deeman - v'+VERSAO_ATUAL+'@CLI'));
    }
}