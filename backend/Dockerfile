# Bazowy obraz Node.js.
# Architektura jest ustawiana podczas `docker buildx build --platform ...`.
FROM node:20-slim

# Ustaw katalog roboczy w kontenerze
WORKDIR /app

# Skopiuj package.json i package-lock.json (jeśli masz)
COPY package*.json ./

# Zainstaluj zależności
RUN npm install --production

# Skopiuj całą aplikację
COPY . .

# Otwórz port API
EXPOSE 5010

# Start aplikacji
CMD ["node", "server/app.js"]
