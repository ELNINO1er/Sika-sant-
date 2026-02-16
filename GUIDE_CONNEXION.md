# 🔐 Guide de Connexion — Sika-Santé

## 📋 Vue d'ensemble

Le système de connexion Sika-Santé propose **4 profils** avec des niveaux de sécurité adaptés :

1. **Patient** — Connexion par OTP/SMS
2. **Professionnel de Santé** — Authentification + MFA
3. **Pharmacie** — E-ordonnance + traçabilité
4. **Institution / État** — Accès renforcé + audit

---

## 🎯 Parcours Utilisateur

### 1️⃣ Page de Choix de Profil

**URL** : `connexion.html`

L'utilisateur clique sur **"Se connecter"** depuis la page d'accueil et accède à la page de sélection de profil.

**Quatre cartes au choix** :
- 🩺 **Patient** → `connexion-patient.html`
- 🏥 **Professionnel de santé** → `connexion-professionnel.html`
- 💊 **Pharmacie** → `connexion-pharmacie.html`
- 🏛️ **Institution / État** → `connexion-institution.html`

---

## 👤 Profil 1 : PATIENT

### Étape 1 : Demande d'OTP

**Page** : `connexion-patient.html`

**Champs** :
- Numéro CMU (10 chiffres)

**Action** : L'utilisateur clique sur **"Recevoir un code par SMS"**

**Backend (simulation)** :
```javascript
POST /api/auth/patient/request-otp
{
  "cmuOrId": "1234567890"
}

Response:
{
  "success": true,
  "otpRequestId": "OTP-1234567890",
  "phoneNumber": "0701234567"
}
```

### Étape 2 : Vérification OTP

**Champs** :
- 6 inputs pour le code OTP (auto-focus)

**Sécurité** :
- ✅ Maximum **5 tentatives**
- ✅ Expiration après **5 minutes**
- ✅ Compte à rebours de **60 secondes** avant renvoi

**Action** : Cliquer sur **"Vérifier le code"**

**Backend (simulation)** :
```javascript
POST /api/auth/patient/verify-otp
{
  "otpRequestId": "OTP-1234567890",
  "otpCode": "123456"
}

Response:
{
  "success": true,
  "accessToken": "jwt_token_...",
  "refreshToken": "refresh_...",
  "userRole": "PATIENT",
  "userData": {
    "role": "PATIENT",
    "cmuNumber": "1234567890",
    "name": "Jean KOUASSI"
  }
}
```

### 🔑 Comptes de Test — Patient

| Numéro CMU | Nom | Téléphone | Code OTP (console) |
|------------|-----|-----------|-------------------|
| `1234567890` | KOUASSI Jean | 0701234567 | Voir console navigateur |
| `0987654321` | KONÉ Marie | 0709876543 | Voir console navigateur |
| `1111111111` | TRAORÉ Ibrahim | 0701111111 | Voir console navigateur |

**Note** : Le code OTP est affiché dans la console du navigateur (F12) lors de la simulation.

---

## 👨‍⚕️ Profil 2 : PROFESSIONNEL DE SANTÉ

### Étape 1 : Login

**Page** : `connexion-professionnel.html`

**Champs** :
- Email professionnel
- Mot de passe
- Case "Se souvenir de moi" (optionnel)

**Sécurité** :
- ✅ Maximum **5 tentatives** de login
- ✅ Blocage progressif après échecs

**Action** : Cliquer sur **"Continuer"**

**Backend (simulation)** :
```javascript
POST /api/auth/pro/login
{
  "email": "dr.kouassi@chu-abidjan.ci",
  "password": "Password123!"
}

Response:
{
  "success": true,
  "mfaRequestId": "MFA-1234567890",
  "role": "DOCTOR",
  "mfaContact": "0701234567"
}
```

### Étape 2 : Authentification à 2 Facteurs (MFA)

**Champs** :
- 6 inputs pour le code MFA

**Affichage** :
- Contact masqué : `070 ** ** 67`
- Rôle affiché : "Médecin"

**Sécurité** :
- ✅ Maximum **5 tentatives** MFA
- ✅ Expiration après **5 minutes**
- ✅ Compte à rebours de **60 secondes**

**Action** : Cliquer sur **"Vérifier et se connecter"**

**Backend (simulation)** :
```javascript
POST /api/auth/pro/verify-mfa
{
  "mfaRequestId": "MFA-1234567890",
  "otpCode": "123456"
}

Response:
{
  "success": true,
  "accessToken": "jwt_pro_...",
  "refreshToken": "refresh_pro_...",
  "role": "DOCTOR",
  "permissions": ["read_patient", "write_consultation", "prescribe", "access_full_history"],
  "userData": {
    "id": "PRO-123",
    "email": "dr.kouassi@chu-abidjan.ci",
    "name": "Dr. Jean KOUASSI",
    "role": "DOCTOR",
    "speciality": "Cardiologie"
  }
}
```

### 🔑 Comptes de Test — Professionnel

| Email | Mot de passe | Rôle | Code MFA (console) |
|-------|--------------|------|-------------------|
| `dr.kouassi@chu-abidjan.ci` | `Password123!` | Médecin | Voir console |
| `inf.kone@chu-treichville.ci` | `Nurse2024!` | Infirmier(ère) | Voir console |
| `pharm.traore@pharmacie-ci.ci` | `Pharma456!` | Pharmacien(ne) | Voir console |

### 🎭 Rôles et Permissions

| Rôle | Permissions |
|------|------------|
| **DOCTOR** | Lecture patient, Écriture consultation, Prescription, Accès historique complet |
| **NURSE** | Lecture patient, Saisie constantes vitales, Accès historique limité |
| **PHARMACIST** | Lecture ordonnance, Validation ordonnance, Dispensation |
| **ER** | Lecture patient, Saisie urgence, Accès info urgence |

---

## 🏛️ Profil 3 : INSTITUTION / ÉTAT

### Étape 1 : Login Institutionnel

**Page** : `connexion-institution.html`

**Champs** :
- Institution (sélection)
- Identifiant institutionnel (format: `GOV-XXX-0000`)
- Mot de passe sécurisé (minimum 12 caractères)

**Sécurité RENFORCÉE** :
- ⚠️ Maximum **3 tentatives** (plus strict)
- ⚠️ Alertes de sécurité automatiques
- ⚠️ Audit trail obligatoire

**Action** : Cliquer sur **"Continuer"**

**Backend (simulation)** :
```javascript
POST /api/auth/gov/login
{
  "institution": "ministere-sante",
  "institutionId": "GOV-MSANTE-1001",
  "password": "SecureGov2024!@#"
}

Response:
{
  "success": true,
  "mfaRequestId": "GOV-MFA-1234567890",
  "mfaContact": "0727000001"
}
```

### Étape 2 : MFA Renforcé

**Champs** :
- 6 inputs pour le code MFA

**Affichage** :
- Institution affichée
- Niveau d'accès : **Élevé**

**Sécurité MAXIMALE** :
- ⚠️ Maximum **3 tentatives** (très strict)
- ⚠️ Compte à rebours de **90 secondes** (plus long)
- ⚠️ Journalisation complète (IP, date, heure, actions)

**Action** : Cliquer sur **"Vérifier et accéder au tableau de bord"**

**Backend (simulation)** :
```javascript
POST /api/auth/gov/verify-mfa
{
  "mfaRequestId": "GOV-MFA-1234567890",
  "otpCode": "123456"
}

Response:
{
  "success": true,
  "accessToken": "jwt_gov_...",
  "refreshToken": "refresh_gov_...",
  "permissions": ["view_anonymized_data", "generate_reports", "view_statistics", "epidemio_dashboard", "health_alerts"],
  "userData": {
    "id": "GOV-MSANTE-1001",
    "institution": "ministere-sante",
    "institutionName": "Ministère de la Santé et de l'Hygiène Publique",
    "accessLevel": "FULL_ACCESS",
    "type": "GOVERNMENT"
  }
}
```

### 🔑 Comptes de Test — Institution

| ID Institutionnel | Institution | Mot de passe | Code MFA (console) |
|-------------------|-------------|--------------|-------------------|
| `GOV-MSANTE-1001` | Ministère de la Santé | `SecureGov2024!@#` | Voir console |
| `GOV-ARTCI-2001` | ARTCI | `ArtciSecure2024!` | Voir console |
| `GOV-CNAM-3001` | CNAM-CI | `CnamSecure2024!` | Voir console |

---

## 🔒 Sécurité Transversale

### Fonctionnalités Implémentées

#### 1. **Limitation des Tentatives**
- Patient : 5 tentatives OTP
- Professionnel : 5 tentatives login + 5 tentatives MFA
- Institution : **3 tentatives** (plus strict)

#### 2. **Expiration des Codes**
- Tous les codes OTP/MFA expirent après **5 minutes**

#### 3. **Compte à Rebours Renvoi**
- Patient : 60 secondes
- Professionnel : 60 secondes
- Institution : **90 secondes** (plus long)

#### 4. **Masquage des Données Sensibles**
- Téléphones : `+225 070 ** ** 67`
- Emails : `dro***@chu-abidjan.ci`

#### 5. **Audit Trail (Institutions uniquement)**
```javascript
{
  "userId": "GOV-MSANTE-1001",
  "institution": "ministere-sante",
  "accessLevel": "HIGH",
  "timestamp": "2025-02-03T20:30:00.000Z",
  "ip": "41.202.XXX.XXX",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "SESSION-1234567890"
}
```

#### 6. **Stockage Local**
Après connexion réussie, stockage dans `localStorage` :
```javascript
localStorage.setItem('sika_access_token', 'jwt_...');
localStorage.setItem('sika_refresh_token', 'refresh_...');
localStorage.setItem('sika_user_role', 'PATIENT|DOCTOR|INSTITUTION');
localStorage.setItem('sika_user_permissions', JSON.stringify([...]));
localStorage.setItem('sika_user_data', JSON.stringify({...}));
```

---

## 🛠️ Pour les Développeurs

### Structure des Fichiers

```
Sika-sant-/
├── connexion.html                      # Page de choix de profil
├── connexion-patient.html              # Login patient (OTP)
├── connexion-professionnel.html        # Login professionnel (Auth + MFA)
├── connexion-institution.html          # Login institution (Renforcé)
├── assets/
│   └── js/
│       ├── auth-patient.js             # Logique auth patient
│       ├── auth-professionnel.js       # Logique auth professionnel
│       └── auth-institution.js         # Logique auth institution
```

### Simulation API

Tous les scripts utilisent des **simulations côté client** :
- Les codes OTP/MFA sont générés et affichés dans la **console du navigateur**
- Les données sont stockées temporairement dans `sessionStorage`
- Aucun backend réel n'est nécessaire pour la démo

### En Production (Recommandations)

#### Backend API Endpoints

```
POST /api/auth/patient/request-otp
POST /api/auth/patient/verify-otp

POST /api/auth/pro/login
POST /api/auth/pro/verify-mfa

POST /api/auth/gov/login
POST /api/auth/gov/verify-mfa

POST /api/auth/refresh-token
POST /api/auth/logout

POST /api/audit/log-access        # Obligatoire pour institutions
POST /api/audit/log-suspicious    # Alertes de sécurité
```

#### Sécurité Backend

1. **Hashing des mots de passe** : bcrypt, argon2
2. **Tokens JWT** : Expiration 15 min (access), 7 jours (refresh)
3. **Rate limiting** : 5 requêtes/minute par IP
4. **HTTPS obligatoire**
5. **CORS configuré**
6. **Logs centralisés** (ELK, Datadog)
7. **SMS Gateway** : Twilio, AWS SNS, ou opérateur local
8. **Base de données** : PostgreSQL avec chiffrement
9. **Conformité RGPD** + lois locales CI

---

## 🧪 Tester le Système

### Étape 1 : Ouvrir la page d'accueil
```bash
# Ouvrir index.html dans un navigateur
```

### Étape 2 : Cliquer sur "Se connecter"
Redirection vers `connexion.html`

### Étape 3 : Choisir un profil

#### Test Patient
1. Cliquer sur "Patient"
2. Entrer CMU : `1234567890`
3. Cliquer "Recevoir un code par SMS"
4. Ouvrir la console (F12) → voir le code OTP
5. Entrer le code à 6 chiffres
6. Cliquer "Vérifier le code"

#### Test Professionnel
1. Cliquer sur "Professionnel de santé"
2. Email : `dr.kouassi@chu-abidjan.ci`
3. Mot de passe : `Password123!`
4. Cliquer "Continuer"
5. Ouvrir la console → voir le code MFA
6. Entrer le code MFA
7. Cliquer "Vérifier et se connecter"

#### Test Institution
1. Cliquer sur "Institution / État"
2. Institution : "Ministère de la Santé"
3. ID : `GOV-MSANTE-1001`
4. Mot de passe : `SecureGov2024!@#`
5. Cliquer "Continuer"
6. Ouvrir la console → voir le code MFA
7. Entrer le code MFA
8. Cliquer "Vérifier et accéder au tableau de bord"

---

## 📞 Support

**En cas de problème** :
- Email : `support@sika-sante.ci`
- Support institutionnel : `support-gov@sika-sante.ci`
- Téléphone : `+225 27 20 XX XX XX`

---

## ✅ Checklist de Déploiement Production

- [ ] Intégrer SMS Gateway réel (Twilio, AWS SNS)
- [ ] Créer API backend (Node.js, Python, PHP)
- [ ] Base de données sécurisée (PostgreSQL + chiffrement)
- [ ] JWT avec rotation et expiration
- [ ] Rate limiting (Redis)
- [ ] HTTPS avec certificat SSL
- [ ] Logs centralisés (ELK Stack)
- [ ] Dashboard de monitoring (Grafana)
- [ ] Tests de pénétration (pentests)
- [ ] Conformité RGPD + lois CI
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Backup automatisé
- [ ] Plan de reprise après sinistre (DRP)

---

**🎉 Félicitations ! Votre système de connexion multi-profils est opérationnel.**

*Généré avec ❤️ pour Sika-Santé — Côte d'Ivoire*
