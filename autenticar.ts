import os from 'os';
import path from 'path';
import fs from 'fs';
import prompt, { Answers, PromptObject } from 'prompts';
import chalk from 'chalk';
import crypt from 'crypto';
import axios, { AxiosResponse } from 'axios';
import open from 'open';
import Console from './console';
import Main from './index';

enum AUTENTICAR_ACAO {
    CRIAR_CONTA = 0,
    LOGAR
}

enum PERGUNTAS {
    autenticar = 0,
    possuiConvite,
    dialogoUsuario,
    dialogoSenha,
    dialogoLogin_usuario,
    dialogoLogin_senha,
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
    private readonly URL_AUTH = 'https://mailer-lag.herokuapp.com';
    //private readonly URL_AUTH = 'http://localhost:3000';
    private readonly ROTAS = ['/logar', '/registrar', '/vefConvite', '/vefNick'];

    private readonly VALIDAR_CONVITE_ROTA = this.URL_AUTH.concat(this.ROTAS[2]);
    private readonly VALIDAR_USUARIO_ROTA = this.URL_AUTH.concat(this.ROTAS[3]);
    private readonly arquivoLogin = path.join(
        os.homedir(), this.SALVAR_NOME
    );

    private readonly cript: CriptoUtils;
    private readonly perguntas = new Array<prompt.PromptObject | prompt.PromptObject[]>();
    constructor() {
        this.cript = new CriptoUtils();
        const saidaPrematura = (estado: { value: string, aborted: boolean }) => {
            if (estado.aborted) {
                Console.negativo('Saindo...');
                process.exit(0);
            }
        }

        this.perguntas.push({
            type: 'select',
            name: 'resp',
            instructions: false,
            message: `${chalk.magenta('Primeiro acesso, o que deseja fazer \n')}`.padStart(8),
            initial: 0,
            onState: saidaPrematura,
            choices: [
                { title: 'Criar conta \n', value: AUTENTICAR_ACAO.CRIAR_CONTA },
                { title: 'Entrar em conta existente', value: AUTENTICAR_ACAO.LOGAR }
            ]
        });

        this.perguntas.push({
            type: 'toggle',
            name: 'sem',
            message: `Você possuí um ${chalk.cyan('convite')}`.padStart(8),
            active: 'não',
            inactive: 'Sim',
            initial: false,
            onState: saidaPrematura
        });

        const validarInput = (n: string) => {
            if (n === '' || n === undefined)
                return 'Digite alguma coisa!';
            if (!this.nomeRegex.test(n))
                return 'Não utilize símbolos e espaços.';
            return true;
        }
        /* cadastro formulário - USUÁRIO */
        this.perguntas.push(
            {
                type: 'text',
                name: 'nomeCadastro',
                message: `Nome de usuário ${chalk.yellow('(')}${chalk.red('sem espaços')}${chalk.yellow(')')}`.padStart(8),
                validate: validarInput,
                onState: saidaPrematura
            }
        );

        this.perguntas.push(
            {
                type: 'password',
                name: 'senhaCadastro',
                message: 'Senha:'.padStart(8),
                validate: validarInput,
                onState: saidaPrematura
            }
        );

        /* FORMULÁRIO DE LOGIN */
        this.perguntas.push({           // USUÁRIO - LOGIN
            type: 'text',
            name: 'usuario',
            message: `${chalk.green('Usuário')}`.padStart(8),
            validate: validarInput,
            onState: saidaPrematura
        });

        this.perguntas.push({
            type: 'password',           // SENHA - LOGIN
            name: 'senha',
            message: `${chalk.green('Senha')}`.padStart(8),
            validate: validarInput,
            onState: saidaPrematura
        });

        // convite input
        this.perguntas.push({
            type: 'text',
            name: 'convite',
            message: `${chalk.yellow('~Convite')}`.padStart(8),
            onState: saidaPrematura,
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

    private sair(): void {
        Console.negativo('Saindo...');
        process.exit(0);
    }

    public static async aut(): Promise<void> {
        const aut = new Autenticar();
        if (!aut.jaAutenticou()) {
            /* verifica se o servidor de login está on */
            try {
                const r = await axios.get(aut.URL_AUTH);
                
            } catch (err) {
                Console.negativo('Servidor de autenticação offline, se o erro persistir entre em contato.');
                console.log('\n');
                process.exit(0);
            }

            console.log('\n');
            const acao = await prompt(aut.perguntas[PERGUNTAS.autenticar]);

            switch (acao.resp) {
                case AUTENTICAR_ACAO.CRIAR_CONTA:
                    await aut.criarConta();
                    break;
                case AUTENTICAR_ACAO.LOGAR:
                    await aut.logar();
                    break;
            }
        } else {
            // lê as credenciais do arquivo
            const loginCriptado = fs.readFileSync(aut.arquivoLogin).toString('utf8');
            let login = { a: 'b' }, err = false;
            try {
                login = JSON.parse(aut.cript.decriptar(loginCriptado));
            } catch (Error) {
                try { fs.unlinkSync(aut.arquivoLogin) } catch (Error) { }
                err = true;
            }

            if (!err) {
                aut.loginOffline(login);
            } else {
                aut.logar();
            }
        }
    }
    /* Login offline para economizar o tempo do dyno no heroku */
    /* Não é possível verificar usuário e senha, o fato de estarem corretos 
       é pressuposto baseando-se no fato de que arquivo foi criptografado usando AES-256 
       com a respectiva chave */
    private loginOffline(loginCarregado: Record<string, string>): void {

        // verifica se o arquivo de login pertence a esta máquina
        if (JSON.stringify(loginCarregado.sisInfo) === JSON.stringify(SisInfo.get())) {
            Console.positivo(`@${loginCarregado.u}`);
            Main.init();
        } else {
            Console.negativo(`Esse login pertence à ${loginCarregado.u} e deve ser utilizado em um único pc.`);
            console.log(chalk.red('\nFeche a janela\n'));
            while (true) {}
        }
    }

    private async logar(tentativas?: number): Promise<void> {
        let usuarioI = '', senhaI = '';
        let tentouLogin = (tentativas !== undefined) ? tentativas : 1;

        if (tentouLogin === 4) {
            const acao = await prompt({
                type: 'select',
                name: 'continuar',
                instructions: false,
                message: 'Detectado várias tentivas de login sem êxito'.padStart(8),
                choices: [
                    { title: 'Continuar tentando...', value: true },
                    { title: 'Sair', value: false }
                ]
            });
            tentouLogin = 1;
            if (!acao.continuar)
                process.exit(0);
        }
        const autenticar = async () => {
            let loginEndPoint = this.URL_AUTH.concat(this.ROTAS[ROTA.LOGIN_]);
            const carga = JSON.stringify({ usuario: usuarioI, senha: senhaI, ...SisInfo.get() });
            const payload = this.cript.encriptar(carga);
            const resp = await axios.post(loginEndPoint, { stub: payload });
            const respObj = JSON.parse(this.cript.decriptar(resp.data.stub));
            return respObj.stats;
        }

        console.log('\n');
        const u = await prompt(this.perguntas[PERGUNTAS.dialogoLogin_usuario]);
        console.log('\n');
        const s = await prompt(this.perguntas[PERGUNTAS.dialogoLogin_senha]);
        await (async () => {
            usuarioI = u.usuario;
            senhaI   = s.senha;
        })();

        const STATUS = await autenticar();
        switch (STATUS) {
            case 'WRONG-PASS':
                Console.negativo('Senha incorreta.');
                console.log('\n');
                this.logar(++tentouLogin);
                break;

            case 'NOT-YOUR':
                Console.negativo('Esse login é válido somente para uma única máquina.');
                console.log('\n');
                console.log(chalk.red('Feche a janela.'));
                while (true) {}
            case 'NO-USER-PASS':
                Console.negativo('Usuário ou senha inválido.')
                console.log('\n');
                this.logar(++tentouLogin);
                break;

            default:
                Console.positivo(`Logado com sucesso na conta ${u.usuario}`);
                this.salvarLogin(u.usuario, s.senha);
                Main.init();
                break;
        }
    }

    private salvarLogin(usuario: string, senha: string): void {
        const carga = JSON.stringify({ u: usuario, s: senha, sisInfo: SisInfo.get() });
        const dados = this.cript.encriptar(carga);
        fs.writeFileSync(this.arquivoLogin, dados);
    }

    private async criarConta(): Promise<void> {
        let prosseguir = false;
        let nickValido = false;
        let conviteInput = {} as Answers<string>;

        let usuario = await prompt(this.perguntas[PERGUNTAS.dialogoUsuario]);
        let senha = await prompt(this.perguntas[PERGUNTAS.dialogoSenha]);
        console.log('\n');
        let semConvite = await prompt(this.perguntas[PERGUNTAS.possuiConvite]);
        if (!semConvite.sem) {
            // possui convite 
            while (!prosseguir) {
                const validarForm = await prompt({
                    type: 'toggle',
                    name: 'erro',
                    message: `Usuário ${chalk.red('[')}${chalk.yellow(usuario.nomeCadastro) + chalk.red(']')} e senha ${chalk.red('[')}${chalk.yellow(senha.senhaCadastro)}${chalk.red(']')} estão corretos`.padStart(8),
                    initial: false,
                    inactive: 'Sim',
                    active: 'não',
                    onState: (s: { value: string, aborted: boolean }) => {
                        if (s.aborted) {
                            Console.negativo('Saindo...');
                            process.exit(0);
                        }
                    }
                });

                /* verifica se o nome de usuário escolhido já não existe */
                const respObj = await axios.post(this.VALIDAR_USUARIO_ROTA, ({ nick: usuario.nomeCadastro }));
                nickValido = respObj.data.status_nick === 'NOVO';
                if (!nickValido && !validarForm.erro) {
                    console.log('\n');
                    Console.exclamacao(`O nick escolhido já está em uso!`);
                }
                // selecionou 'Sim'
                prosseguir = !validarForm.erro && nickValido;
                if (!prosseguir) {
                    console.log('\n');
                    usuario = await prompt(this.perguntas[PERGUNTAS.dialogoUsuario]);
                    senha = await prompt(this.perguntas[PERGUNTAS.dialogoSenha]);
                }
            }

            console.log('\n');
            conviteInput = await prompt(this.perguntas[PERGUNTAS.conviteInput]);
            const urlAlvo = this.URL_AUTH.concat(this.ROTAS[ROTA.CADASTRO]);
            const cnv = {
                convite: conviteInput.convite, infoSis: SisInfo.get(),
                usuario: usuario.nomeCadastro, senha: senha.senhaCadastro
            };
            const payload = this.cript.encriptar(JSON.stringify(cnv));
            const resp = await axios.post(urlAlvo, { stub: payload });

            const retorno = JSON.parse(this.cript.decriptar(resp.data.stub));
            switch (retorno.stats) {
                case 'REG-OK':
                    Console.positivo('Conta criada com sucesso! Faça login com seu novo registro.\n');
                    await this.logar();
                    break;
                case 'INV-CNV':
                    Console.negativo('O convite digitado é invalído.');
                    process.exit(0);
                    break;
                default:
                    Console.negativo('Houve um erro ao efetuar o cadastro, tente novamente mais tarde.\n');
                    process.exit(0);
            }

        } else {

            // não possui convite
            console.log('\n');
            Console.positivo('Para efetuar a compra da licença, visite nossa página e abra um chat.');
            console.log('\n');
            await open('https://www.facebook.com/software.baron');
            console.log(chalk.red('Até a próxima, você pode fechar essa janela.'));
            while (true) {}
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
