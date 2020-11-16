# BuzzMail - descontinuado

BuzzMail é um script cli, para o envio de e-mails em massa automaticamente.

  - Quando atinge o limite de 500/dia, pula para a próxima conta
  - Lê os e-mails alvos de um arquivo de texto
  - Mostra informações de sucesso/falhas


> Pelo fato do script estar descontinuado
> é necessário retirar a lógica relacionada
> ao sistema de login embutido

### Pré requisitos
- NodeJs v14
- Npm
### Instalando o projeto e as dependências
```
    git clone https://github.com/pabloQubit/BuzzMail.git
    cd BuzzMail
    npm install ou yarn install
```

### Gerando o executável (.exe)

Gerar o executável é bem simples, basta instalar globalmente as seguintes dependências:
 ```
 npm install -g gulp pkg javascript-obfuscator
 ```
 Após isso basta executar o comando, dentro do diretório BuzzMail:
 ```
 gulp
 ```
 Após esse comando acima, será gerado os executáveis x64 e x86 em BuzzMail\downloads
 
 :octocat: Bom hacking! :octocat:
 
