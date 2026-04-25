# TDC_GRPC Remote Stack (GHCR)

Uruchamianie calego TDC_GRPC z gotowych obrazow z GHCR (Portainer lub docker compose).

## 1) Wymagania

- Docker + Docker Compose v2
- Dostep do `ghcr.io` (dla prywatnego repo: token `read:packages`)

## 2) Konfiguracja

```bash
cd deploy/remote-stack
cp .env.example .env
```

Ustaw co najmniej:

- `GHCR_OWNER` (lowercase)
- `IMAGE_TAG` (`latest` albo `sha-xxxxxxx`)
- `TDC_AUTH_PASSWORD`

## 3) Start stacka

```bash
docker compose --env-file .env -f docker-compose.ghcr.yml pull
docker compose --env-file .env -f docker-compose.ghcr.yml up -d
```

## 4) Endpointy

- Frontend: `http://<host>:5000`
- Backend API: `http://<host>:5010`
- Remote Command Channel: `http://<host>:5555`

## 5) Portainer (Web UI)

W `Create stack`:

- wklej `docker-compose.ghcr.yml`
- dodaj zmienne z `.env.example` w sekcji Environment variables
- `GHCR_OWNER` podaj lowercase (np. `mundus131`)

## 6) Aktualizacja

```bash
docker compose --env-file .env -f docker-compose.ghcr.yml pull
docker compose --env-file .env -f docker-compose.ghcr.yml up -d
```
