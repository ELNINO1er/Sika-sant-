# Implementation technique

## Backend

### Stack

- Node.js
- Express
- MySQL
- Joi
- JWT
- bcrypt
- csurf
- winston

### Architecture

```text
routes -> validation -> controllers -> services -> models -> MySQL
```

### Securite

- secrets JWT obligatoires via variables d'environnement
- OTP hashes avec bcrypt
- refresh tokens hashes avec SHA-256
- rotation et revocation des refresh tokens
- CSRF sur les routes mutantes
- validation Joi sur body, query et params
- audit logs sur les operations sensibles

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

## Frontend

### Stack

- HTML modulaire
- Bootstrap 5
- JavaScript vanilla en ES modules

### Services

- `frontend/services/api.js`: client HTTP unique, gestion CSRF, refresh et erreurs globales
- `frontend/services/auth.js`: login, OTP, MFA, logout, profil
- `frontend/services/patients.js`: patients et consultations
- `frontend/services/admin.js`: users et audit logs

### Components

- `data-table.js`
- `form.js`
- `modal.js`
- `navbar.js`
- `sidebar.js`

## Production

- `backend/.env.example` contient les variables requises
- `backend/Dockerfile` fournit l'image applicative
- `scripts/deploy-backend.ps1` sert de point de depart pour les deploiements locaux
- Swagger est expose sur `/api/v1/docs`
