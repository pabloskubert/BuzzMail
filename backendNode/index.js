const express = require('express');
const helmet = require('helmet');
const app = express()
const rotas = require('./rotas.js');

process.env.LINK_HOST = 'https://mailer-lag.herokuapp.com';
process.env.CHAVE_CRIPTOGRAFAR = 'jogueteatresirmao81284251856278414812';

app.set('view engine', 'ejs');
app.set('views', './paginas');

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(rotas);

app.listen(process.env.PORT, () => {
    console.log('App servidor iniciado')
});
