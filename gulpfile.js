const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function defaultTask(cb) {
    /* Limpa os builds anteriores e prepara o ambiente */
    try { fs.rmdirSync(path.resolve(__dirname, 'dist'), { recursive: true }); }
    catch (Error) { }

    try { fs.mkdirSync(path.resolve(__dirname, 'dist')); }
    catch (Error) { console.log(`Erro: ${Error.message}`) }

    try { fs.mkdirSync(path.resolve(__dirname, 'dist', 'obfuscado')); }
    catch (Error) { console.log('Erro ao criar diretório dist/obfuscado ') }
    try {
        fs.unlinkSync(path.resolve(__dirname, 'download', 'mailerLag-x64.exe'));
        fs.unlinkSync(path.resolve(__dirname, 'download', 'mailerLag-x86.exe'));
    } catch (Error) { }

    const build = exec('npm run build');
    build.on('exit', () => {
        obfuscarCodigo(() => {
            /* depois de obfuscado, gera o .exe */
            const gerarExe = exec('npm run ap:pack');
            gerarExe.on('exit', () => {
                console.log('MailerLag.exe gerado!');
            });
        });
    });

    cb();
}

function obfuscarCodigo(cb) {
    const obfus = exec('npm run obfus');
    obfus.on('exit', cb);
}

exports.default = defaultTask
