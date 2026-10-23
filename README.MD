# DT207G Projektarbete: Pizzeria Bianconeri (REST-webbtjänst, backend)

En fristående REST-webbtjänst (backend) för Pizzeria Bianconeri som hanterar menyn, bordsbokningar och säker inloggning via JWT (JSON Web Tokens) mot en PostgreSQL-databas.

## GitHub-repo

https://github.com/ardalansale/dt207g-projekt-api

## Publicerad webbplats (API)

https://dt207g-projekt-api-xqcb.onrender.com/

## Funktionalitet

- Publik hämtning av meny (`GET /api/menu`).
- Publik inloggning för personal via säkert, förskapat admin-konto (`POST /api/login`). Publik registrering är borttagen.
- Publikt mottagande av bordsbokningar (`POST /api/bookings`).
- JWT-autentisering via middleware (`verifyToken`) för att skydda administrativa routes.
- Fullständig CRUD-hantering för menyn via skyddade endpoints (skapa, uppdatera, radera).
- Skyddad bokningshantering för personal (se och radera inkomna bokningar via `GET /api/bookings` och `DELETE /api/bookings/:id`).
- Automatisk tabellskapning och säkring av admin-kontot vid serverstart (`initDb()`).

## Komponenter och struktur

- `server.js`: Huvudfil som hanterar Express-servern, databaskoppling mot Neon PostgreSQL, automatisk initiering och samtliga API-routes.
- `package.json`: Hanterar projektets beroenden och skript.
- `.env`: Håller miljövariabler lokalt (exkluderad via `.gitignore`).
- `.gitignore`: Döljer känsliga filer och beroenden (`node_modules`, `.env`) från Git.

## Tekniker

- Node.js & Express
- PostgreSQL (Neon) med `pg`
- JSON Web Tokens (`jsonwebtoken`)
- Bcryptjs (`bcryptjs` för lösenordshashning)
- CORS (`cors`)
- Dotenv (`dotenv`)

## Miljövariabler (.env)

Följande miljövariabler krävs för att köra applikationen:

```env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=ett_hemligt_nyckel
ADMIN_USER=admin
ADMIN_PASSWORD=ett_admin_lösenord
```

## Körning

1. Klona repot och installera beroenden med `npm install`.
2. Skapa en `.env`-fil i rotkatalogen och konfigurera nödvändiga miljövariabler (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`).
3. Starta servern lokalt med `node server.js` (kör som standard på port 3000).