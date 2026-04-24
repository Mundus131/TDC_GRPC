# Build stage.
# Architektura jest ustawiana podczas `docker buildx build --platform ...`.
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Serve stage.
FROM nginx:alpine

# Skopiuj build do nginx
COPY --from=build /app/build /usr/share/nginx/html

# Reverse proxy dla API/WebSocket backendu.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
