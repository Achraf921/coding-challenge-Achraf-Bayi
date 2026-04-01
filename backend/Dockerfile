FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=base /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
