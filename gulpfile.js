const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const debugLog = (processo) => {
    return function (msgEvento) {
        console.log(processo, msgEvento);
    }
}

function defaultTask(terminarTask) {
    /* Limpa os builds anteriores e prepara o ambiente */
    console.info('\n', 'Removendo arquivos em dist/');
    try { fs.rmSync(path.resolve(__dirname, 'dist'), { recursive: true, force: true }); }
    catch (Error) { }

    console.info('\n', 'Recriando diretório dist/');
    try { fs.mkdirSync(path.resolve(__dirname, 'dist')); }
    catch (Error) { console.log(`Erro: ${Error.message}`) }

    console.info('\n', 'Criando diretório dist/obfuscado');
    try { fs.mkdirSync(path.resolve(__dirname, 'dist', 'obfuscado')); }
    catch (Error) { console.log('Erro ao criar diretório dist/obfuscado ') }
    
    console.info('\n', 'Criando diretório download que vai receber os binários.');
    try {
        fs.rmSync(path.join(__dirname, 'download'), { recursive: true, force: true });
    } catch (Error) { }

    console.info('\n', 'Transpilando TS para JS...');
    const build = exec('npm run build');
    const buildLog = debugLog('[debug] compilador tsc: ');
    build.on('exit', () => {

        /* 
            Como este software estava a venda, o mecanismo de obfuscação é uma forma de proteger
            o sistema de autenticação para evitar engenharia reversa. 
        */
        console.info('\n', 'Obfuscando...');
        obfuscarCodigo(() => {
            /* depois de obfuscado, gera o stand-alone */

            const criarStandalone = exec('npm run ap:pack');
            const pkgLog = debugLog('[debug] pkg exec msg: ');

            console.info('\n', 'Criando executável em download/');
            criarStandalone.on('exit', () => {
                console.info('\n', 'Stand-alone gerado em download/BuzzMail, para executar: ./BuzzMail');
                terminarTask();
            });

            criarStandalone.on('error', pkgLog);
            criarStandalone.on('message', pkgLog);
        });
    });

    build.on('error', buildLog);
    build.on('message', buildLog);
}

function obfuscarCodigo(cb) {
    const obfusLog = debugLog('[debug] javascript-obfuscator msg: ');
    const obfus = exec('npm run obfus');

    obfus.on('exit', cb);
    obfus.on('error', obfusLog);
    obfus.on('message', obfusLog);
}

exports.default = defaultTask
