# Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependências
COPY package.json package-lock.json ./
RUN npm install

# Copiar código e arquivos de configuração
COPY . .

# Variáveis de ambiente durante o build (se necessário)
# No Next.js, variáveis NEXT_PUBLIC_ precisam estar presentes no build
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Gerar o build
RUN npm run build

# Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar arquivos necessários do builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
