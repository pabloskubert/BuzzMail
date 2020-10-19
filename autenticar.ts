import prompt from 'prompts';
import Main from './index';

export default class Autenticar {

    public static aut(): void {
        console.log('\n\n');
        prompt({
            type: 'password',
            name: 'pass',
            message: 'Digite o serial para ativar',
            validate: (userInput: string): boolean | string => {
                return (userInput === 'root')
                        ? true
                        : 'Serial invalído';
            }
        }).then(() => {

            Main.init();
        });
    }
}
