# DT207G Projektarbete - Pizzeria Bianconeri – REST-webbtjänst (Backend)
En fristående REST-webbtjänst (backend) för Pizzeria Bianconeri som hanterar menyn, bordsbokningar och säker inloggning via JWT (JSON Web Tokens) mot en PostgreSQL-databas.

## GitHub-repo
https://github.com/ardalansale/dt207g-projekt-api

## Publicerad webbplats (API)
https://dt207g-projekt-api-xqcb.onrender.com/

## Funktionalitet
- Publik hämtning av meny (`GET /api/menu`).
- Publik inloggning för personal via säkert, förskapat admin-konto (`POST /api/login`) – publik registrering är borttagen.
- Publikt mottagande av bordsbokningar (`POST /api/bookings`).
- JWT-autentisering via middleware för att skydda administrativa routes.
- Fullständig CRUD-hantering för menyn via skyddade endpoints (skapa, uppdatera, radera).
- Automatisk tabellskapning och säkring av admin-kontot vid serverstart.

## Komponenter och struktur
- `server.js` – Huvudfil som hanterar Express-servern, databaskoppling mot Neon PostgreSQL, automatisk initiering och samtliga API-routes.
- `package.json` – Hanterar projektets beroenden och skript.
- `.gitignore` – Döljer känsliga filer från Git.

## Tekniker
- Node.js & Express
- PostgreSQL (Neon)
- JSON Web Tokens (JWT)
- Bcryptjs (lösenordshashning)
- CORS

## Körning
1. Klona repot och installera beroenden med `npm install`.
2. Konfigurera nödvändiga miljövariabler (`DATABASE_URL`, `JWT_SECRET`).
3. Starta servern lokalt med `node server.js` (kör som standard på port 3000).