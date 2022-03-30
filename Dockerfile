FROM node:lts-alpine as build

ENV NODE_ENV build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN npm run tailwind:build


FROM node:lts-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY --from=build /app/dist ./dist

ENV HYSHARE_HYDRUS_API_URL=http://host.docker.internal:45869

EXPOSE 3000

CMD ["node", "dist/main"]