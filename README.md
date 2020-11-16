# BuzzMail :mailbox: :email:

BuzzMail é um script cli, para o envio de e-mails em massa automaticamente.

#### Características chave:
  - Escolha qualquer template html para enviar
  - Quando atinge o limite de 500/dia, pula para a próxima conta
  - Lê os e-mails alvos de um arquivo de texto
  - Mostra informações de sucesso/falhas

>Obs: A minha intenção foi criar um script
> e vendê-lo o mais rápido possível,
>portanto o código não está em um padrão de design comum.

### Pré-requisitos
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
 
