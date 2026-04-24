# Użyj lekkiego obrazu Node.js.
# Architektura jest ustawiana podczas `docker buildx build --platform ...`.
FROM node:20-slim

# Ustaw katalog roboczy
WORKDIR /app

# Skopiuj pliki zależności i zainstaluj je
COPY package*.json ./
RUN npm install

# Skopiuj resztę plików aplikacji
COPY . .

# Domyślny port (można nadpisać zmienną środowiskową)
EXPOSE 5555

# Komenda startowa
CMD ["node", "server.js"]
