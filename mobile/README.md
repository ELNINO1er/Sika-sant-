# Mobile

Base Expo / React Native pour Sika-Sante.

## Demarrage

```bash
cd mobile
copy .env.example .env
npm start
```

## URL API

Par defaut, l'application pointe vers :

```text
http://10.0.2.2:4000/api/v1
```

Notes :

- `10.0.2.2` fonctionne pour l'emulateur Android.
- Sur appareil physique, remplacez par l'IP locale de la machine qui execute le backend.
- Si vous utilisez Expo Go, pensez aussi a autoriser l'origine cote backend via `CORS_ORIGINS`.

## Structure

```text
mobile/
|-- App.js
|-- src/
|   |-- config/
|   |   `-- env.js
|   |-- screens/
|   |   `-- HomeScreen.js
|   `-- services/
|       `-- api.js
`-- .env.example
```
