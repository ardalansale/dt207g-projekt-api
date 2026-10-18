# DT207G Projektarbete - Pizzeria Bianconeri – REST-webbtjänst (Backend)
En fristående REST-webbtjänst (backend) för Pizzeria Bianconeri med stöd för CRUD-operationer och säker inloggning via JWT (JSON Web Tokens).

## GitHub-repo
https://github.com/ardalansale/dt207g-projekt-api

## Publicerad webbplats (API)
https://dt207g-projekt-api-xqcb.onrender.com/

## Funktionalitet
- Publika endpoints för att hämta aktuell meny.
- Registrering och inloggning för administratörer med krypterade lösenord (bcrypt).
- JWT-autentisering för att skydda administrativa routes.
- Stöd för att lägga till och radera menyelement (CRUD) via skyddade anrop.
- Datavalidering innan lagring för ökad säkerhet.

## Komponenter och struktur
- `server.js` – Huvudfil som hanterar Express-servern, databaskoppling och samtliga API-routes (publika och skyddade).
- `package.json` – Hanterar projektets beroenden och skript.
- `.gitignore` – Döljer känsliga filer och beroenden från Git.

## Tekniker
- Node.js
- Express
- JSON Web Tokens (JWT)
- Bcryptjs (lösenordshashning)
- CORS

## Körning
1. Klona repot och installera beroenden med `npm install`.
2. Starta servern lokalt med `node server.js`.
3. Servern körs som standard på `http://localhost:3000`.