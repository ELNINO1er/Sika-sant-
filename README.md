# Sika-Sante

Plateforme healthcare full-stack avec frontend modulaire unique, backend Node.js/Express/MySQL, authentification OTP/MFA, audit logs et API versionnee en `/api/v1`.

## Etat actuel

Le projet est organise autour de deux blocs actifs :

- `frontend/` : interface unique en HTML, Bootstrap 5 et JavaScript modulaire.
- `backend/` : API REST Express, JWT courts, rotation des refresh tokens, validation Joi, audit logs, Swagger.

Le legacy frontend a la racine du projet est retire du chemin cible. Le backend sert directement `frontend/`.

## Architecture cible

### Roles

- `PATIENT`
- `PROFESSIONAL`
- `ADMIN`
- `INSTITUTION`

### Permissions

- `read_patient`
- `write_patient`
- `prescribe`
- `view_audit_logs`

### Mapping role -> permissions

- `PATIENT`: aucune permission metier
- `PROFESSIONAL`: `read_patient`, `write_patient`, `prescribe`
- `ADMIN`: `read_patient`, `write_patient`, `prescribe`, `view_audit_logs`
- `INSTITUTION`: `view_audit_logs`

## Structure

```text
Sika-sant-/
|-- backend/
|   |-- app.js
|   |-- server.js
|   |-- config/
|   |-- constants/
|   |-- controllers/
|   |-- docs/swagger.yaml
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- tests/
|   |-- validation/
|   |-- .env.example
|   `-- Dockerfile
|-- frontend/
|   |-- index.html
|   |-- assets/
|   |-- components/
|   |-- pages/
|   |-- services/
|   `-- utils/
|-- scripts/
|   `-- deploy-backend.ps1
`-- README.md
```

## Backend

### Endpoints principaux

- `GET /api/v1/health`
- `GET /api/v1/csrf-token`
- `POST /api/v1/auth/request-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/verify-mfa`
- `POST /api/v1/auth/resend-mfa`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/user/profile`
- `GET /api/v1/patients`
- `POST /api/v1/patients`
- `GET /api/v1/patients/:patientUserId/consultations`
- `POST /api/v1/patients/:patientUserId/consultations`
- `GET /api/v1/users`
- `GET /api/v1/audit-logs`
- `GET /api/v1/metrics`

### Format de reponse

Toutes les reponses controllers suivent le format :

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

### Securite

- CSRF avec header unique `x-xsrf-token`
- JWT access token court
- rotation des refresh tokens
- hash des OTP
- hash des refresh tokens en base
- validation Joi sur les routes a payload/query
- audit logs pour les evenements sensibles
- variables d'environnement obligatoires

## Frontend

Le frontend modulaire contient :

- guards `authGuard()` et `roleGuard()`
- client API unique `frontend/services/api.js`
- dashboards relies a l'API reelle
- composants reutilisables pour tables, formulaires, modals et notifications

### Pages principales

- `/pages/connexion.html`
- `/pages/connexion-patient.html`
- `/pages/connexion-professionnel.html`
- `/pages/connexion-admin.html`
- `/pages/connexion-institution.html`
- `/pages/dashboard-patient.html`
- `/pages/dashboard-professional.html`
- `/pages/dashboard-admin.html`
- `/pages/dashboard-institution.html`

## Installation locale

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
```

Renseigner ensuite :

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS`

### 2. Base de donnees

Executer le schema :

```bash
mysql -u root -p < schema.sql
```

### 3. Demarrage

```bash
cd backend
npm run dev
```

Application disponible sur `http://localhost:4000`.

Le frontend est servi directement par Express sur la meme origine.

## Tests

```bash
cd backend
npm test
```

Les tests couvrent :

- endpoint de sante
- presence du CSRF
- validation payload auth

## Docker

Build local :

```bash
docker build -t sika-sante-backend:latest backend
```

Script PowerShell d'aide :

```powershell
./scripts/deploy-backend.ps1
```

## Documentation API

Swagger UI :

```text
http://localhost:4000/api/v1/docs
```

## Notes de production

- Remplacer tous les secrets d'exemple avant tout deploiement.
- Brancher un vrai transport OTP/MFA au lieu du log console en environnement non-dev.
- Ajouter une couche de monitoring externe sur `/api/v1/metrics`.
- Prevoir rotation des secrets, sauvegardes et journalisation centralisee.
