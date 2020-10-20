import chalk from 'chalk';

export default class Console {

    static positivo(msg: string): void {
        const pos = chalk.green.bold('[+] ');
        console.log(pos.concat(chalk.yellow.bold(msg, '\n')));
    }

    static negativo(msg: string): void {
        const neg = chalk.red.bold('[-] ');
        console.log(neg.concat(chalk.yellow.bold(msg, '\n')));
    }
}