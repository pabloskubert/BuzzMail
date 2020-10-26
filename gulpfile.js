const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const pr = (prefixar) => prefixar.concat(' --prefix ',__dirname);
function defaultTask(cb) {
    /* Limpa os builds anteriores e prepara o ambiente */
    fs.rmdirSync(path.resolve(__dirname, 'dist'), { recursive: true });
    fs.mkdirSync(path.resolve(__dirname, 'dist'));
    fs.mkdirSync(path.resolve(__dirname, 'dist', 'obfuscado'));
    try {
        fs.unlinkSync(path.resolve(__dirname, 'download', 'mailerLag-x64.exe'));
        fs.unlinkSync(path.resolve(__dirname, 'download', 'mailerLag-x86.exe'));
    } catch (Error) {}

    const build = exec(pr('npm run build'));
    build.on('exit', () => {
        obfuscarCodigo(() => {

            /* depois de obfuscado, gera o .exe */
            const gerarExe = exec(pr('npm run ap:pack'));
            gerarExe.on('exit', () => {
                console.log('MailerLag.exe gerado!');
            })
        });
    });
    cb();
}

function obfuscarCodigo(cb) {
    const obfus = exec('npm run obfus');
    obfus.on('exit', cb);
}

exports.default = defaultTask
