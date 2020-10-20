import prompt from 'prompts';
import Main from './index';

export default class Autenticar {

    public static aut(): void {
        console.log('\n\n');
        prompt({
            type: 'password',
            name: 'password',
            message: 'Senha para entrar',
            validate: (userInput: string): boolean | string => {
                return (userInput === 'lucius13')
                        ? true
                        : 'Serial invalído';
            }
        }).then(() => {

            Main.init();
        });
    }
}
