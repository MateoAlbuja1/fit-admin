FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV FITADMIN_API_URL=

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["node", "dist/fit-admin/server/server.mjs"]
