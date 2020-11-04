import chalk from 'chalk';

export default class Console {

    static positivo(msg: string): void {
        const pos = chalk.green.bold('[+] ');
        console.log('\n'+pos.concat(chalk.yellow.bold(msg)).padStart(8));
    }

    static negativo(msg: string): void {
        const neg = chalk.red.bold('[-] ');
        console.log('\n'+neg.concat(chalk.yellow.bold(msg).padStart(8)));
    }

    static exclamacao(msg: string): void {
        console.log(chalk.yellow('\n[!]'), chalk.green(msg).padStart(8));
    }
}