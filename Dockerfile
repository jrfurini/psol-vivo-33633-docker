# syntax=docker/dockerfile:1.5

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app

# Instala apenas as dependências
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

