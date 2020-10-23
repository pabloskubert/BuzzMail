const Route = require('express').Router;
const crypto = require('crypto');
const path = require('path');
const escpString = require('escape-string-regexp');
const sqlite = require('sqlite3').verbose();
const chaveAcesso = 'vagotten';

const rotaMgr = Route()
const dbLocal = path.join(__dirname, 'db', 'mailerLogins.db3');
const db = new sqlite.Database(dbLocal, sqlite.OPEN_READWRITE, (err) => {
    if (err)
        console.error(err.message);
    
    console.log('Conectado ao banco de dados mailerLogins.db3');
});

class CriptoUtils { 
    static encriptar(textoPuro, cb) {
        const
            IV = crypto.randomBytes(16),
            salt = crypto.randomBytes(16);

        const chave = process.env.CHAVE_CRIPTOGRAFAR;
        crypto.pbkdf2(chave, salt, 100000, 256/8, 'sha256', (err, chaveCipher) => {
            if (err) throw err;
            let encriptar = crypto.createCipheriv('aes-256-cbc', chaveCipher, IV);
            encriptar.write(textoPuro);
            encriptar.end();

            const encriptado = encriptar.read();
            const valorFinal = Buffer.concat([salt, IV, encriptado]).toString('base64');
            cb(valorFinal);
        });
    }

    static decriptar(textoCifrado, cb) {
        const cifrado = Buffer.from(textoCifrado, 'base64');
        const salt_len = 16;
        const iv_len = 16;

        const salt = cifrado.slice(0, salt_len);
        const iv = cifrado.slice(salt_len, iv_len + salt_len);
        const chave = crypto.pbkdf2Sync(process.env.CHAVE_CRIPTOGRAFAR, salt, 100000, 256 / 8, 'sha256');
        const decriptar = crypto.createDecipheriv('aes-256-cbc', chave, iv);

        decriptar.write(cifrado.slice(salt_len + iv_len));
        decriptar.end();

        let decriptado = decriptar.read();
        cb(decriptado.toString());
    }
}

rotaMgr.get('/', (req,res) => {
    let chave = (req.query['allowBy'] !== undefined)
        ? escpString(req.query['allowBy']) : '';

    if (
        chave === chaveAcesso
    ) {
        res.render('index', { chave: chaveAcesso, postForm: process.env.LINK_HOST });
    } else res.send('Operation not allowed.');
});

rotaMgr.post('/logar', (req, res) => {
    let payload = req.body['stub'];
    if (payload === undefined) res.end();

    const retornarStatus = (status) => {
        const carga = JSON.stringify({ stats: status });
        CriptoUtils.encriptar(carga, (payload) => {
            res.json({
                stub: payload
            });
        });
    }

    CriptoUtils.decriptar(payload, (carga) => {
        // busca por usuário no banco de dados
        const infos = JSON.parse(carga);
        db.serialize((err) => {
            if (err) {
                return console.error(err.message);
            }

            const sql = `SELECT * FROM cadastros WHERE usuario = ? AND senha = ?`;
            db.get(sql, [infos.usuario,infos.senha], (err, row) => {
                if (err) {
                    return console.error(err.message);
                }

                if (row) {
                    // verifica senhas
                    if (row.senha !== infos.senha) retornarStatus('WRONG-PASS');

                    // verifica se o post partiu da máquina permitida
                    if (JSON.stringify(infos) === JSON.stringify(row)) {
                        // TODAS AS INFOS BATEM
                        retornarStatus('OK');
                    } else retornarStatus('NOT-YOUR');
                } else {
                    
                    retornarStatus('NO-USER-PASS');
                }
            });  
        })
    });
});
rotaMgr.post('/registrar', (req, res) => {
    let payload = req.body['stub'];
    if (payload === undefined) res.end();

    CriptoUtils.decriptar(payload, (decifrado) => {
        const infos = JSON.parse(decifrado);
        db.serialize((err) => {
            if (err)
                console.error(err.message);
            
            // verifica se o convite é válido
            db.get(`SELECT convite FROM convites WHERE convite = ?`, [infos.convite], (err, row) => {
                if (row === undefined) {
                    const carga = JSON.stringify({ stats: 'INV-CNV' });
                    CriptoUtils.encriptar(carga, (payload) => {

                        res.json({ stub: payload });
                    });
                }
            });

            const sql = `INSERT INTO cadastros(usuario,senha,homedir,hostname,cpu,platform,arch,type) VALUES(?,?,?,?,?,?,?,?)`;
            const i = infos;
            const convite = i.convite;
            const sis = i.infoSis;

            let cadastrado = true;
            db.run(sql, [i.usuario, i.senha, sis.homedir, sis.hostname, sis.cpu, sis.platform, sis.arch, sis.type], (err) => {
                if (err) {
                    return console.error(err.message);
                }

                // remove o convite
                if (cadastrado) {
                    db.run(`DELETE FROM convites WHERE convite=?`, convite, (err) => {
                        if (err) {
                            return console.error(err.message);
                        }

                        console.log(`Linhas modificadas: ${this.changes}`);
                    });
                }

                const carga = JSON.stringify({ stats: (cadastrado) ? 'REG-OK' : 'ERR' });
                CriptoUtils.encriptar(carga, (payload) => {
                    res.json({
                        stub: payload
                    });
                });
            });
        });
    });
});
rotaMgr.post('/vefConvite', (req,res) => {
    let payload = req.body['stub'];
    if (payload === undefined) res.end();

    CriptoUtils.decriptar(payload, (decifrado) => {
        let conviteRecebido = JSON.parse(decifrado).convite;
        db.get(`SELECT convite FROM convites WHERE convite = ?`, [conviteRecebido], (err, row) => {
            if (err)
                return console.log(err.message);
            
            CriptoUtils.encriptar(JSON.stringify({
                convite: conviteRecebido,
                seems: (row !== undefined)?'OK':'WRONG'
            }), (textoCifrado) => {
                res.json({
                    stub: textoCifrado
                });
            });
        });
    });
});

rotaMgr.post('/novoConvite', (req, res) => {
    let chave = (req.query['allowBy'] !== undefined)
        ? escpString(req.query['allowBy']) : '';
    let cadastrarConvite = req.body['convite'];
    
    if (chave === chaveAcesso) {
        db.run(`INSERT INTO convites(convite) VALUES (?)`, [cadastrarConvite], (err) => {
            if (err) {
                return console.log(err.message);
            }

            res.send('CONVITE CADASTRADO');
        });
    } else res.send('Operation now allowed');
});

module.exports = rotaMgr;
