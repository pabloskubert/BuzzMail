import cp from 'child_process';
import { Configuracao } from './entrada';

export default class IniciarEnvio {

    constructor(cnf: Configuracao) {
        
        cp.spawn('cmd', ['/C', 'start cmd.exe']);
    }
}
