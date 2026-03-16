# Guia de Deploy: Coopergen no Easypanel

Siga estes passos para colocar sua aplicação no ar no servidor VPS.

## 1. Preparação no Easypanel
1. No seu Easypanel, clique em **Project** e selecione (ou crie) o seu projeto.
2. Clique em **Service** -> **App**.
3. Escolha o nome para o serviço (ex: `coopergen-front`).

## 2. Configuração de Origem (Source)
Se você estiver usando GitHub/GitLab:
1. Selecione **Git** como a fonte.
2. Informe o repositório e a branch (ex: `main`).
3. O Easypanel detectará automaticamente o `Dockerfile` que acabei de criar na raiz do projeto.

## 3. Variáveis de Ambiente (Environment Variables)
No Easypanel, vá na aba **Environment** e adicione TODAS estas variáveis (copie os valores do seu `.env.local` atual):

| Variável | Valor Recomendado |
| :--- | :--- |
| `DATABASE_URL` | Sua URL do Postgres |
| `JWT_SECRET` | Chave secreta de autenticação |
| `JWT_REFRESH_SECRET` | Chave secreta de refresh |
| `NEXT_PUBLIC_APP_URL` | `https://seu-dominio.com.br` |
| `EVOLUTION_API_URL` | URL da Evolution API |
| `EVOLUTION_API_KEY` | Sua chave da API |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Seu e-mail Gmail |
| `SMTP_PASS` | Sua senha de app do Gmail |
| `SMTP_FROM` | E-mail remetente |

## 4. Domínio e Rede
1. Na aba **Domains**, adicione o seu domínio (ex: `coopergen.com.br`).
2. O Easypanel gerará o certificado SSL automaticamente.

## 5. Build e Deploy
1. Clique em **Deploy**.
2. O sistema fará o build da imagem Docker (isso pode levar alguns minutos na primeira vez) e colocará o site no ar.

## Dicas Importantes
- **Webhook do WhatsApp**: Após o deploy, não esqueça de configurar a URL do Webhook no painel da Evolution API apontando para: `https://seu-dominio.com.br/api/webhooks/whatsapp`.
- **Database**: Como o seu banco já está no Easypanel, a conexão deve ser instantânea.
