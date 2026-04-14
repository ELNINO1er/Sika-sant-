# Guide de connexion

Ce document decrit le parcours actuel de connexion sur la version refactorisee.

## Base URL

- Frontend servi par Express: `http://localhost:4000`
- API unique: `http://localhost:4000/api/v1`

## Flux patient

1. `POST /api/v1/auth/request-otp`
2. `POST /api/v1/auth/verify-otp`
3. stockage du `accessToken`, du `refreshToken` et du profil utilisateur
4. redirection vers `/pages/dashboard-patient.html`

Payload initial :

```json
{
  "cmuNumber": "1234567890"
}
```

## Flux professionnel / admin / institution

1. `POST /api/v1/auth/login`
2. `POST /api/v1/auth/verify-mfa`
3. rotation du refresh token sur les appels de refresh
4. redirection vers le dashboard du role

Exemple login professionnel :

```json
{
  "loginType": "professional",
  "email": "dr.kouassi@chu-abidjan.ci",
  "password": "mot_de_passe_seed"
}
```

Exemple login admin :

```json
{
  "loginType": "admin",
  "email": "admin@sika-sante.ci",
  "password": "mot_de_passe_seed"
}
```

Exemple login institution :

```json
{
  "loginType": "institution",
  "institutionId": "GOV-CNAM-3001",
  "password": "mot_de_passe_seed"
}
```

## CSRF

Avant chaque `POST`, le frontend recupere un token via :

```text
GET /api/v1/csrf-token
```

Le header a transmettre est :

```text
x-xsrf-token: <token>
```

## Guards frontend

- `authGuard()` : verifie l'access token, tente un refresh sinon redirige vers `/pages/connexion.html`
- `roleGuard()` : bloque l'acces si le role courant ne correspond pas a la page

## Dashboards

- Patient: profil + historique de consultations
- Professionnel: liste des patients + ajout de consultation
- Admin: utilisateurs + audit logs
- Institution: health check + audit logs
