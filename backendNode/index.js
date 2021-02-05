const express = require('express');
const helmet = require('helmet');
const app = express()
const rotas = require('./rotas.js');

process.env.LINK_HOST = '<HOST RESPONSÁVEL PELA AUTENTICAÇÃO>';
process.env.CHAVE_CRIPTOGRAFAR = '<CHAVE PARA CRIPTOGRAFAR COMUNICAÇÃO ENTRE O CLIENT E O SERVER;

app.set('view engine', 'ejs');
app.set('views', './paginas');

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(rotas);

app.listen(process.env.PORT, () => {
    console.log('App servidor iniciado')
});
