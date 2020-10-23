import os from 'os';
import path from 'path';
import fs from 'fs';
import prompt from 'prompts';
import chalk from 'chalk';
import logsimb from 'log-symbols';
import crypt from 'crypto';
import axios, { AxiosResponse } from 'axios';
import Console from './console';
import Main from './index';

enum AUTENTICAR_ACAO {
    CRIAR_CONTA = 0,
    LOGAR
}

enum PERGUNTAS {
    autenticar = 0,
    possuiConvite,
    formConta,
    formLogin,
    conviteInput
}

enum ROTA {
    LOGIN_ = 0,
    CADASTRO,
    VERIFICAR_CONVITE
}

/* lembre-se, chame o Main.init() após a autenticação */
type Login = { u: string, s: string };
export default class Autenticar {

    private readonly SALVAR_NOME = '.mailerAuth';
    private readonly nomeRegex = /^[a-zA-Z0-9]+$/;
    private readonly URL_AUTH = 'http://localhost:3000';
    private readonly ROTAS = ['/logar', '/registrar', '/vefConvite'];

    private readonly VALIDAR_CONVITE_ROTA = this.URL_AUTH.concat(this.ROTAS[2]);
    private readonly arquivoLogin = path.join(
        os.homedir(), this.SALVAR_NOME
    );

    private readonly cript: CriptoUtils;
    private readonly perguntas = new Array<prompt.PromptObject | prompt.PromptObject[]>();
    constructor() {

        this.cript = new CriptoUtils();
        this.perguntas.push({
            type: 'select',
            name: 'resp',
            instructions: false,
            message: `${chalk.magenta('Primeiro acesso, o que deseja fazer')}`,
            initial: 0,
            choices: [
                { title: 'Criar conta', value: AUTENTICAR_ACAO.CRIAR_CONTA },
                { title: 'Entrar em conta existente', value: AUTENTICAR_ACAO.LOGAR }
            ]
        });

        this.perguntas.push({
            type: 'toggle',
            name: 'sem',
            message: `Você possuí um ${chalk.cyan('convite')}`,
            active: 'não',
            inactive: 'Sim',
            initial: false
        });

        const validarInput = (n: string) => (!this.nomeRegex.test(n)) ? 'Sem símbolos e espaços, somente letras e números.' : true;
        this.perguntas.push([
            {
                type: 'text',
                name: 'nomeUsuario',
                message: `Nome de usuário ${chalk.yellow('(')}${chalk.red('sem espaços')}${chalk.yellow(')')}`,
                validate: validarInput
            },
            {
                type: 'password',
                name: 'senhaUsuario',
                message: 'Senha:',
            }
        ]);

        /* form login */
        this.perguntas.push([
            {
                type: 'text',
                name: 'usuario',
                message: `${chalk.green('Usuário')}`,
                validate: validarInput
            },
            {
                type: 'password',
                name: 'senha',
                message: `${chalk.green('Senha')}`,
                validate: validarInput
            }
        ]);

        // convite input
        this.perguntas.push({
            type: 'text',
            name: 'convite',
            message: `${chalk.yellow('~Convite')}`,
            validate: async (conviteInput): Promise<boolean | string> => {

                const sintaxe = validarInput(conviteInput);
                if (typeof sintaxe === 'string')
                    return sintaxe;

                const dados = JSON.stringify({
                    convite: conviteInput
                });

                const dadosCifrados = this.cript.encriptar(dados);
                const resp = await axios.post(this.VALIDAR_CONVITE_ROTA, {
                    stub: dadosCifrados
                });

                const retorno = JSON.parse(this.cript.decriptar(resp.data.stub));
                if (retorno.seems === 'OK') {
                    process.env.CONVITE_VALIDO = 'OK';
                    return true;
                } else return 'Convite inválido';
            }
        });
    }

    public static async aut(): Promise<void> {
        const aut = new Autenticar();
        if (!aut.jaAutenticou()) {

            console.log('\n');
            const acao = await prompt(aut.perguntas[PERGUNTAS.autenticar]);

            switch (acao.resp) {
                case AUTENTICAR_ACAO.CRIAR_CONTA:
                    aut.criarConta();
                    break;
                case AUTENTICAR_ACAO.LOGAR:
                    aut.logar();
                    break;
            }
        } else { 
            // lê as credenciais do arquivo
            Console.positivo('Logando...');
            const loginCriptado = fs.readFileSync(aut.arquivoLogin).toString('utf8');
            const login = JSON.parse(aut.cript.decriptar(loginCriptado));
            aut.logar({
                u: login.u,
                s: login.s
            });
        }
    }

    private async logar(credenciais?: Login): Promise<void> {
        let usuarioI = '', senhaI = '';
        const autenticar = async () => {
            let loginEndPoint = this.URL_AUTH.concat(this.ROTAS[ROTA.LOGIN_]);
            const carga = JSON.stringify({ usuario: usuarioI, senha: senhaI, ...SisInfo.get() });
            const payload = this.cript.encriptar(carga);

            const resp = await axios.post(loginEndPoint, {
                stub: payload
            });

            const respObj = JSON.parse(this.cript.decriptar(resp.data.stub));
            return respObj.stats;
        }

        if (credenciais === undefined) {
            console.log('\n');
            const credenciais = await prompt(this.perguntas[PERGUNTAS.formLogin]);
            if (credenciais.usuario === undefined || credenciais.senha === undefined)
                process.exit(0);

            usuarioI = credenciais.usuario;
            senhaI = credenciais.senha;

        } else {
            usuarioI = credenciais.u;
            senhaI = credenciais.s;
        }

        const STATUS = await autenticar();
        switch (STATUS) {
            case 'WRONG-PASS':
                Console.negativo('Senha incorreta.');
                this.logar(undefined);
                break;

            case 'NOT-YOUR':
                Console.negativo('Esse login é válido somente para uma única máquina.');
                process.exit(0);

            case 'NO-USER-PASS':
                Console.negativo('Usuário ou senha inválido.')
                this.logar(undefined);
                break;

            default:
                Console.positivo(`${(credenciais === undefined) ? 'Logado com sucesso!' : `@${usuarioI}`}`);
                process.env.LOGG = 'OK';

                if (credenciais === undefined) this.salvarLogin(usuarioI, senhaI);
                Main.init();
                break;
        }
    }

    private salvarLogin(usuario: string, senha: string): void {
        const carga = JSON.stringify({ u: usuario, s: senha });
        const dados = this.cript.encriptar(carga);
        fs.writeFileSync(this.arquivoLogin, dados);
    }

    private async criarConta(): Promise<void> {
        let prosseguir = false;

        let infosBasicas = await prompt(this.perguntas[PERGUNTAS.formConta]);
        console.log('\n');
        const semConvite = await prompt(this.perguntas[PERGUNTAS.possuiConvite]);

        if (!semConvite.sem) {
            // possui convite 
            while (!prosseguir) {
                const validarForm = await prompt({
                    type: 'toggle',
                    name: 'erro',
                    message: `Usuário ${chalk.red('[')}${chalk.yellow(infosBasicas.nomeUsuario) + chalk.red(']')} e senha ${chalk.red('[')}${chalk.yellow(infosBasicas.senhaUsuario)}${chalk.red(']')} estão corretos`,
                    initial: false,
                    inactive: 'Sim',
                    active: 'não'
                });

                // selecionou 'Sim'
                prosseguir = !validarForm.erro;
                console.log('\n');
                if (validarForm.erro)
                    infosBasicas = await prompt(this.perguntas[PERGUNTAS.formConta]);
            }
            const conviteInput = await prompt(this.perguntas[PERGUNTAS.conviteInput]);
            if (process.env.CONVITE_VALIDO !== 'OK') {
                Console.negativo('Saída prematura do diálogo...');
                process.exit(0);
            }

            const urlAlvo = this.URL_AUTH.concat(this.ROTAS[ROTA.CADASTRO]);
            const cnv = {
                convite: conviteInput.convite, infoSis: SisInfo.get(),
                usuario: infosBasicas.nomeUsuario, senha: infosBasicas.senhaUsuario
            };
            const payload = this.cript.encriptar(JSON.stringify(cnv));
            const resp = await axios.post(urlAlvo, { stub: payload });

            const retorno = JSON.parse(this.cript.decriptar(resp.data.stub));
            if (retorno.stats === 'REG-OK') {
                Console.positivo('Cadastrado com sucesso! Faça login com seu novo registro.');
                Console.positivo('Execute novamente o programa e escolha a opção entrar.');
                process.exit(0);

            } else if (retorno.stats === 'INV-CNV') {

                Console.negativo('O convite digitado é invalído.');
                process.exit(0);
            } else {
                Console.negativo(`O nome de usuário escolhido já está em uso!`);
                process.exit(0);
            }

        } else {

            // não possui convite
            console.log('\n', logsimb.warning,
                chalk.bold.white('Por apenas R$135,00 você obtém o "convite", para usar este software sempre que quiser.'));
            console.log(logsimb.info, chalk.white.bold('Me contate no e-mail: ') + chalk.yellow.underline(
                'pablo1920@protonmail.com'
            ).concat(' ou no meu facebook ') + chalk.red.underline('https://www.facebook.com/pablo6102') + ' se você deseja obter este software.')
            console.log('\n\n');
            process.exit(0);
        }
    }

    private jaAutenticou(): boolean {
        return fs.existsSync(this.arquivoLogin);
    }
}

class SisInfo {
    static get(): Record<string, string> {
        return {
            homedir: os.homedir(),
            hostname: os.hostname(),
            cpu: os.cpus()[0].model,
            platform: os.platform(),
            arch: os.arch(),
            type: os.type()
        }
    }
}
class CriptoUtils {

    private readonly chaveRaw = "jogueteatresirmao81284251856278414812";
    private readonly algoritmo = 'aes-256-cbc';

    public decriptar(textoCifrado: string): string {
        const cifrado = Buffer.from(textoCifrado, 'base64');
        const salt_len = 16;
        const iv_len = 16;

        const salt = cifrado.slice(0, salt_len);
        const iv = cifrado.slice(salt_len, iv_len + salt_len);
        const chave = crypt.pbkdf2Sync(this.chaveRaw, salt, 100000, 256 / 8, 'sha256');
        const decriptar = crypt.createDecipheriv(this.algoritmo, chave, iv);

        decriptar.write(cifrado.slice(salt_len + iv_len));
        decriptar.end();

        let decriptado = decriptar.read();
        return decriptado.toString();
    }

    public encriptar(textoPuro: string): string {

        const salt = crypt.randomBytes(16);
        const IV = crypt.randomBytes(16);
        const chave = crypt.pbkdf2Sync(this.chaveRaw, salt, 100000, 256 / 8, 'sha256');
        const criptografar = crypt.createCipheriv(this.algoritmo, chave, IV);

        let encriptado;
        criptografar.write(textoPuro);
        criptografar.end();

        encriptado = criptografar.read();
        const completo = Buffer.concat([salt, IV, encriptado]).toString('base64');
        return completo;
    }
}
