# Enviar e-mails de verdade — Central de Facilities

Este pacote faz a Central de Facilities enviar e-mails reais (chamados, requisições, chat)
usando o SendGrid. Como a chave do SendGrid não pode ficar exposta no navegador, essa pasta
contém uma função de backend (Vercel) que guarda a chave em segredo e faz o envio por trás.

Siga os passos na ordem. Leva uns 10 minutos no total.

## Parte 1 — Configurar o SendGrid

1. Crie uma conta gratuita em https://signup.sendgrid.com/ (o plano free permite 100 e-mails/dia, para sempre).
2. Verifique o remetente:
   - Vá em **Settings → Sender Authentication → Single Sender Verification**.
   - Cadastre `administrativo@grupolle.com.br` (o e-mail que você quer que apareça como remetente).
   - O SendGrid manda um e-mail de confirmação para essa caixa — alguém com acesso a ela precisa clicar no link para confirmar.
   - **Sem esse passo, o SendGrid recusa qualquer envio.**
3. Crie uma API Key:
   - Vá em **Settings → API Keys → Create API Key**.
   - Dê um nome (ex: "central-facilities") e escolha **Restricted Access** → habilite só **Mail Send**.
   - Copie a chave gerada agora — ela só é mostrada uma vez.

## Parte 2 — Publicar a função (Vercel, gratuito)

Você vai precisar da [Vercel CLI](https://vercel.com/docs/cli) (ou pode importar esta pasta
como projeto pelo site vercel.com, o resultado é o mesmo).

**Opção A — pelo site (mais simples, sem instalar nada):**
1. Crie uma conta gratuita em https://vercel.com (pode entrar com GitHub, Google ou e-mail).
2. Clique em **Add New → Project**.
3. Se for pela CLI (opção B) pule este passo; se for pelo site, você precisa colocar esta pasta
   (`send-email-function`) num repositório do GitHub primeiro e importar esse repositório aqui.
4. Depois de importado, antes de clicar em "Deploy", abra **Environment Variables** e adicione:
   - `SENDGRID_API_KEY` → a chave que você copiou no Parte 1.
   - `SENDGRID_FROM_EMAIL` → `administrativo@grupolle.com.br`
   - `SENDGRID_FROM_NAME` → `Central de Facilities` (opcional)
5. Clique em **Deploy**.

**Opção B — pela linha de comando (mais rápido se você tem Node instalado):**
```bash
cd send-email-function
npx vercel login
npx vercel --prod
```
Durante o processo, quando perguntar sobre variáveis de ambiente, adicione as três acima
(ou depois em **vercel.com → seu projeto → Settings → Environment Variables** e rode
`npx vercel --prod` de novo para aplicar).

## Parte 3 — Conectar o app à função

Ao final do deploy, a Vercel te dá uma URL parecida com:
```
https://central-facilities-send-email.vercel.app
```

A função fica acessível em:
```
https://central-facilities-send-email.vercel.app/api/send-email
```

Copie essa URL completa (terminando em `/api/send-email`) e me envie — eu atualizo o
`EMAIL_API_URL` no `index.html` e no artifact para apontar pra ela. A partir daí, todo
chamado, requisição e mensagem de chat vai gerar um e-mail de verdade, automaticamente.

## Testando

Depois de configurado, você pode testar a função isoladamente (sem abrir o app) rodando:
```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"seuemail@teste.com","subject":"Teste","body":"Funcionou!"}'
```
Se dentro de alguns segundos chegar o e-mail, está tudo certo.

## Limites do plano gratuito

- SendGrid free: 100 e-mails/dia, para sempre.
- Vercel free: mais que suficiente para esse volume de chamadas.
- Se um dia o volume de chamados/requisições crescer muito, basta fazer upgrade do plano do SendGrid — o código não muda.
