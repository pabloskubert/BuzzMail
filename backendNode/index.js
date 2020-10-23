const express = require('express');
const helmet = require('helmet');
const app = express()
const rotas = require('./rotas.js');

process.env.LINK_HOST = 'http://localhost:3000';
process.env.CHAVE_CRIPTOGRAFAR = 'jogueteatresirmao81284251856278414812';

app.set('view engine', 'ejs');
app.set('views', './paginas');

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(rotas);

app.listen(3000, () => {
    console.log('App servidor iniciado')
});
