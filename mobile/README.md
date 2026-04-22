# Mobile

Base Expo / React Native pour Sika-Sante.

La base contient maintenant une maquette mobile plus riche :

- onboarding inspire de `app1.pdf`
- dashboard inspire de `App2.pdf`
- messagerie inspiree de `App3.pdf`
- typographies `Sora` et `Manrope`
- images locales reprises du frontend web

## Demarrage

```bash
cd mobile
copy .env.example .env
npm start
```

Puis :

- `a` pour ouvrir l'application dans l'emulateur Android
- `w` pour verifier le rendu web

## URL API

Par defaut, l'application pointe vers :

```text
http://10.0.2.2:4000/api/v1
```

Notes :

- `10.0.2.2` fonctionne pour l'emulateur Android.
- Sur appareil physique, remplacez par l'IP locale de la machine qui execute le backend.
- Si vous utilisez Expo Go, pensez aussi a autoriser l'origine cote backend via `CORS_ORIGINS`.

## Backend requis

Dans un autre terminal :

```bash
cd backend
npm run dev
```

L'application mobile restaure maintenant la session de connexion et utilise les jetons bearer plutot que de dependre uniquement des cookies navigateur.

## Structure

```text
mobile/
|-- App.js
|-- src/
|   |-- config/
|   |   `-- env.js
|   |-- data/
|   |   `-- mockData.js
|   |-- screens/
|   |   `-- MobilePrototypeScreen.js
|   `-- services/
|       `-- api.js
|   `-- theme/
|       `-- tokens.js
`-- .env.example
```
