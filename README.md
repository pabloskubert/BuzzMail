# BuzzMail :mailbox: :email:

BuzzMail é um script cli, para o envio de e-mails em massa automaticamente, vídeo demonstrando o uso:
https://youtu.be/Ohi7QkxnWpY

#### Características chave:
  - 
  - Quando atinge 500 envios, pula para o próximo login (conta e senha no arquivo txt)
  - Envia para os e-mails lidos de um arquivo de texto (cada e-mail separado por ",")
  - Mostra a porcentagem de envios bem sucedidos, e de envios que falharam.

### Pré-requisitos
- NodeJs v14
- Npm
- Git CLI - Não é necessário caso você baixe o zip

### Guia para instalar o BuzzMail:

#### Faça download do projeto
```
    git clone https://github.com/pabloQubit/BuzzMail.git ou baixe diretamente o ZIP
    cd BuzzMail
    npm install ou yarn install
```

#### Gere o executável stand alone (.exe, .deb, .rpm) 
Gerar o executável é bem simples, basta executar o comando abaixo dentro do diretório BuzzMail:
 ```
  npm run gulp
 ```

 Após a execução do comando __gulp__, será gerado os executáveis x64 e x86 em BuzzMail\downloads
 E pronto, simples assim!
 
 Qualquer __dúvida__ me chame no fb/protonmail. :incoming_envelope:
 
 :octocat: Se você achou esse projeto útil deixe uma :star: para aumentar a relevância! :octocat:
 
 ### Futuras melhorias: 
 - Gerar binários pré-compilados e colocar no repositório (evitando o processo acima)
 - Implementar anti-spam com criptografia. 
 - Salvar configurações para uso posterior.
 
