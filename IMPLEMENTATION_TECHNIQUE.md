# 🔧 Implémentation Technique — Système d'Authentification Sika-Santé

## 📦 Fichiers Créés

```
Sika-sant-/
├── connexion.html                      # Page de sélection de profil
├── connexion-patient.html              # Authentification patient (OTP)
├── connexion-professionnel.html        # Authentification professionnel (Auth + MFA)
├── connexion-institution.html          # Authentification institution (Renforcée)
├── GUIDE_CONNEXION.md                  # Guide utilisateur complet
├── COMPTES_TEST.md                     # Comptes de test et scénarios
├── IMPLEMENTATION_TECHNIQUE.md         # Ce fichier
└── assets/
    └── js/
        ├── auth-patient.js             # 380 lignes
        ├── auth-professionnel.js       # 450 lignes
        └── auth-institution.js         # 520 lignes
```

**Total** : 7 fichiers créés, ~1350 lignes de JavaScript

---

## 🏗️ Architecture Technique

### Frontend Stack (existant)
- **Bootstrap 5** : Framework CSS
- **AOS** : Animations on scroll
- **Vanilla JavaScript** : Logique d'authentification

### Simulation Backend
- Pas de serveur réel
- Simulations via `sessionStorage` + `localStorage`
- Codes OTP/MFA affichés dans console navigateur

---

## 📋 Flux d'Authentification

### 1. Profil PATIENT

```
┌──────────────┐
│  index.html  │
│  (Accueil)   │
└──────┬───────┘
       │ Clic "Se connecter"
       ▼
┌──────────────────┐
│ connexion.html   │
│ (Choix profil)   │
└──────┬───────────┘
       │ Clic "Patient"
       ▼
┌────────────────────────┐
│ connexion-patient.html │
└────────┬───────────────┘
         │
         │ ÉTAPE 1: Demande OTP
         │ ────────────────────
         │ Input: cmuNumber
         │ ↓ handleRequestOtp()
         │ ↓ simulateRequestOtp()
         │ ↓ Génère OTP (console)
         │ ↓ sessionStorage.setItem('temp_otp')
         │
         │ ÉTAPE 2: Vérification OTP
         │ ────────────────────────
         │ Input: 6 digits OTP
         │ ↓ handleVerifyOtp()
         │ ↓ simulateVerifyOtp()
         │ ↓ Vérifie OTP + expiration
         │ ↓ localStorage.setItem('sika_access_token')
         │
         ▼
┌────────────────────────┐
│ dashboard-patient.html │
│ (À créer)              │
└────────────────────────┘
```

### 2. Profil PROFESSIONNEL

```
┌─────────────────────────────┐
│ connexion-professionnel.html│
└─────────┬───────────────────┘
          │
          │ ÉTAPE 1: Login
          │ ───────────────
          │ Input: email + password
          │ ↓ handleLogin()
          │ ↓ simulateLogin()
          │ ↓ Vérifie credentials
          │ ↓ Génère MFA (console)
          │ ↓ sessionStorage.setItem('temp_mfa')
          │
          │ ÉTAPE 2: MFA
          │ ──────────────
          │ Input: 6 digits MFA
          │ ↓ handleVerifyMfa()
          │ ↓ simulateVerifyMfa()
          │ ↓ Charge role + permissions
          │ ↓ localStorage.setItem('sika_user_role')
          │ ↓ localStorage.setItem('sika_user_permissions')
          │ ↓ logAccess() [audit trail]
          │
          ▼
┌────────────────────────────────┐
│ dashboard-professionnel.html   │
│ (À créer)                      │
└────────────────────────────────┘
```

### 3. Profil INSTITUTION

```
┌───────────────────────────────┐
│ connexion-institution.html    │
└─────────┬─────────────────────┘
          │
          │ ÉTAPE 1: Login Institutionnel
          │ ────────────────────────────
          │ Input: institution + institutionId + password
          │ ↓ handleLogin()
          │ ↓ simulateLogin()
          │ ↓ Vérifie whitelist institutionnelle
          │ ↓ Génère MFA (console)
          │ ↓ sessionStorage.setItem('temp_gov_mfa')
          │ ↓ logFailedAttempt() si échec
          │
          │ ÉTAPE 2: MFA Renforcé
          │ ───────────────────────
          │ Input: 6 digits MFA
          │ ↓ handleVerifyMfa()
          │ ↓ simulateVerifyMfa()
          │ ↓ Permissions anonymisées uniquement
          │ ↓ localStorage.setItem('sika_institution')
          │ ↓ logSecureAccess() [audit obligatoire]
          │ ↓ logSuspiciousActivity() si 3 échecs
          │
          ▼
┌────────────────────────────────┐
│ dashboard-institution.html     │
│ (À créer)                      │
└────────────────────────────────┘
```

---

## 🔐 Sécurité Implémentée

### État Global (appState)

Chaque fichier JS maintient un état global :

```javascript
let appState = {
  // Identifiants
  otpRequestId: null,        // ID de la requête OTP/MFA
  cmuNumber: null,           // Patient uniquement
  userEmail: null,           // Professionnel uniquement
  institutionId: null,       // Institution uniquement

  // Sécurité
  otpAttempts: 0,
  maxAttempts: 5,            // 3 pour institutions
  otpExpirationTime: 5 * 60 * 1000,  // 5 minutes

  // UI
  resendCountdown: 60,       // 90 pour institutions
  resendInterval: null,

  // Login attempts
  loginAttempts: 0,
  maxLoginAttempts: 5        // 3 pour institutions
};
```

### Fonctions de Validation

#### Patient
```javascript
// Validation CMU (10 chiffres)
if (!/^\d{10}$/.test(cmuNumber)) {
  showError('Le numéro CMU doit contenir exactement 10 chiffres');
  return;
}
```

#### Professionnel
```javascript
// Validation email + password
if (!email || !password) {
  showError('Veuillez remplir tous les champs');
  return;
}
```

#### Institution
```javascript
// Validation ID institutionnel
if (!/^GOV-[A-Z]+-\d{4}$/i.test(institutionId)) {
  showError('Format d\'identifiant invalide (GOV-XXX-0000)');
  return;
}

// Validation mot de passe robuste
if (password.length < 12) {
  showError('Le mot de passe doit contenir au moins 12 caractères');
  return;
}
```

### Simulation OTP/MFA

```javascript
async function simulateRequestOtp(cmuNumber) {
  // Simuler délai réseau
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Base de données mock
  const mockDatabase = {
    '1234567890': { name: 'KOUASSI Jean', phone: '0701234567' },
    // ...
  };

  if (mockDatabase[cmuNumber]) {
    // Générer OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SIMULATION] OTP généré: ${otp}`);

    // Stocker temporairement
    sessionStorage.setItem('temp_otp', otp);
    sessionStorage.setItem('temp_otp_time', Date.now().toString());

    return {
      success: true,
      otpRequestId: `OTP-${Date.now()}`,
      phoneNumber: mockDatabase[cmuNumber].phone
    };
  } else {
    return {
      success: false,
      message: 'Numéro CMU non trouvé'
    };
  }
}
```

### Vérification avec Expiration

```javascript
async function simulateVerifyOtp(otpRequestId, otpCode) {
  const storedOtp = sessionStorage.getItem('temp_otp');
  const storedTime = parseInt(sessionStorage.getItem('temp_otp_time'));

  // Vérifier expiration (5 minutes)
  if (Date.now() - storedTime > appState.otpExpirationTime) {
    return {
      success: false,
      message: 'Le code a expiré. Veuillez en demander un nouveau.'
    };
  }

  // Vérifier le code
  if (otpCode === storedOtp) {
    // Nettoyer
    sessionStorage.removeItem('temp_otp');
    sessionStorage.removeItem('temp_otp_time');

    return {
      success: true,
      accessToken: 'jwt_token_' + Date.now(),
      refreshToken: 'refresh_' + Date.now()
    };
  } else {
    return {
      success: false,
      message: 'Code incorrect'
    };
  }
}
```

### Audit Trail (Institutions)

```javascript
async function logSecureAccess(userData) {
  const accessLog = {
    userId: userData.id,
    institution: userData.institution,
    institutionId: userData.institutionId,
    accessLevel: 'HIGH',
    timestamp: new Date().toISOString(),
    ip: 'simulated_ip',  // En prod: récupéré côté serveur
    userAgent: navigator.userAgent,
    sessionId: 'SESSION-' + Date.now()
  };

  console.log('[AUDIT INSTITUTIONNEL] Accès enregistré:', accessLog);

  // En production: POST /api/audit/gov-access
}

function logSuspiciousActivity() {
  const suspiciousLog = {
    institutionId: appState.institutionId,
    timestamp: new Date().toISOString(),
    ip: 'simulated_ip',
    reason: 'MAX_ATTEMPTS_EXCEEDED',
    severity: 'HIGH'
  };

  console.error('[SECURITY ALERT] Activité suspecte:', suspiciousLog);

  // En production: Alerte SOC immédiate
}
```

---

## 🎨 Interface Utilisateur

### Composants Réutilisables

#### 1. OTP Inputs (6 chiffres)

```html
<div class="otp-inputs">
  <input type="text" class="form-control otp-input" maxlength="1" data-index="0" />
  <input type="text" class="form-control otp-input" maxlength="1" data-index="1" />
  <!-- ... -->
</div>
```

**Fonctionnalités** :
- Auto-focus sur input suivant
- Backspace pour retour arrière
- Paste d'un code à 6 chiffres
- Validation : chiffres uniquement

```javascript
function setupOtpInputs() {
  otpInputs.forEach((input, index) => {
    // Auto-focus
    input.addEventListener('input', function(e) {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    // Backspace
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    // Chiffres uniquement
    input.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Paste handler
    input.addEventListener('paste', function(e) {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
      const digits = pastedData.split('').slice(0, 6);

      digits.forEach((digit, i) => {
        if (otpInputs[i]) otpInputs[i].value = digit;
      });
    });
  });
}
```

#### 2. Compte à Rebours Renvoi

```javascript
function startResendCountdown() {
  appState.resendCountdown = 60;  // ou 90 pour institutions
  resendBtn.disabled = true;

  appState.resendInterval = setInterval(() => {
    appState.resendCountdown--;
    timerElement.textContent = `(${appState.resendCountdown}s)`;

    if (appState.resendCountdown <= 0) {
      clearInterval(appState.resendInterval);
      resendBtn.disabled = false;
      timerElement.textContent = '';
    }
  }, 1000);
}
```

#### 3. Messages d'Erreur/Succès

```javascript
function showError(message) {
  errorText.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

function showSuccess(message) {
  successText.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}
```

#### 4. Toggle Password Visibility

```javascript
function handleTogglePassword() {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  toggleIcon.classList.toggle('bi-eye');
  toggleIcon.classList.toggle('bi-eye-slash');
}
```

---

## 📊 Données Stockées

### sessionStorage (Temporaire)

Utilisé pendant le processus d'authentification :

```javascript
// OTP/MFA
sessionStorage.setItem('temp_otp', '123456');
sessionStorage.setItem('temp_otp_time', Date.now().toString());

// Données utilisateur temporaires
sessionStorage.setItem('temp_user_data', JSON.stringify(userData));

// Gouvernement
sessionStorage.setItem('temp_gov_mfa', '789012');
```

### localStorage (Persistant)

Stockage après connexion réussie :

```javascript
// Tokens
localStorage.setItem('sika_access_token', 'jwt_...');
localStorage.setItem('sika_refresh_token', 'refresh_...');

// Rôle
localStorage.setItem('sika_user_role', 'PATIENT|DOCTOR|INSTITUTION');

// Permissions (professionnels et institutions)
localStorage.setItem('sika_user_permissions', JSON.stringify([
  'read_patient',
  'write_consultation',
  'prescribe'
]));

// Données utilisateur
localStorage.setItem('sika_user_data', JSON.stringify({
  id: 'PRO-123',
  name: 'Dr. Jean KOUASSI',
  role: 'DOCTOR'
}));

// Institution (spécifique)
localStorage.setItem('sika_institution', 'ministere-sante');
```

---

## 🚀 Passer en Production

### 1. Backend API

#### Endpoints Requis

```javascript
// Patient
POST /api/auth/patient/request-otp
Body: { cmuOrId: "1234567890" }
Response: { success: true, otpRequestId: "OTP-123" }

POST /api/auth/patient/verify-otp
Body: { otpRequestId: "OTP-123", otpCode: "123456" }
Response: { success: true, accessToken: "jwt...", userData: {...} }

// Professionnel
POST /api/auth/pro/login
Body: { email: "...", password: "..." }
Response: { success: true, mfaRequestId: "MFA-123", role: "DOCTOR" }

POST /api/auth/pro/verify-mfa
Body: { mfaRequestId: "MFA-123", otpCode: "654321" }
Response: { success: true, accessToken: "jwt...", permissions: [...] }

// Institution
POST /api/auth/gov/login
POST /api/auth/gov/verify-mfa

// Communs
POST /api/auth/refresh-token
POST /api/auth/logout
POST /api/audit/log-access
```

### 2. Remplacer les Simulations

**Dans auth-patient.js** :

```javascript
// AVANT (simulation)
async function simulateRequestOtp(cmuNumber) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`OTP: ${otp}`);
  sessionStorage.setItem('temp_otp', otp);
  return { success: true, otpRequestId: `OTP-${Date.now()}` };
}

// APRÈS (production)
async function requestOtp(cmuNumber) {
  const response = await fetch('/api/auth/patient/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmuOrId: cmuNumber })
  });

  const data = await response.json();
  return data;
}
```

### 3. Intégrer SMS Gateway

```javascript
// Backend (Node.js exemple)
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

async function sendOTP(phoneNumber, otpCode) {
  await client.messages.create({
    body: `Votre code Sika-Santé : ${otpCode}. Valide 5 minutes.`,
    from: '+22501234567',
    to: phoneNumber
  });
}
```

### 4. JWT & Refresh Tokens

```javascript
// Backend
const jwt = require('jsonwebtoken');

function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}
```

### 5. Base de Données

```sql
-- Table Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  cmu_number VARCHAR(10) UNIQUE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Professionnels
CREATE TABLE professionals (
  id UUID PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- DOCTOR, NURSE, PHARMACIST
  mfa_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Institutions
CREATE TABLE institutions (
  id UUID PRIMARY KEY,
  institution_id VARCHAR(50) UNIQUE NOT NULL, -- GOV-XXX-0000
  institution_type VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  access_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_type VARCHAR(20), -- PATIENT, PROFESSIONAL, INSTITUTION
  action VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 6. Rate Limiting (Redis)

```javascript
const redis = require('redis');
const client = redis.createClient();

async function checkRateLimit(ip, maxAttempts = 5, windowSeconds = 300) {
  const key = `rate_limit:${ip}`;
  const current = await client.incr(key);

  if (current === 1) {
    await client.expire(key, windowSeconds);
  }

  if (current > maxAttempts) {
    throw new Error('Trop de tentatives. Réessayez plus tard.');
  }
}
```

---

## 🧪 Tests

### Tests Unitaires (Jest)

```javascript
describe('OTP Validation', () => {
  test('should validate 10-digit CMU', () => {
    expect(validateCMU('1234567890')).toBe(true);
    expect(validateCMU('123')).toBe(false);
  });

  test('should expire OTP after 5 minutes', () => {
    const otpTime = Date.now() - (6 * 60 * 1000); // 6 minutes ago
    expect(isOTPExpired(otpTime)).toBe(true);
  });
});
```

### Tests d'Intégration

```javascript
describe('Patient Authentication Flow', () => {
  test('should request OTP successfully', async () => {
    const response = await requestOTP('1234567890');
    expect(response.success).toBe(true);
    expect(response.otpRequestId).toBeDefined();
  });

  test('should verify correct OTP', async () => {
    const response = await verifyOTP('OTP-123', '123456');
    expect(response.success).toBe(true);
    expect(response.accessToken).toBeDefined();
  });
});
```

---

## 📈 Monitoring & Logs

### Logs de Sécurité

```javascript
// Winston (Node.js)
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

// Log tentative échouée
logger.warn('Failed login attempt', {
  email: 'dr.kouassi@chu.ci',
  ip: '41.202.XXX.XXX',
  timestamp: new Date().toISOString()
});
```

### Métriques

- Nombre de connexions par profil
- Taux de succès OTP/MFA
- Tentatives bloquées
- Temps de réponse API

---

## ✅ Checklist Déploiement

- [ ] Backend API (Node.js/Python/PHP)
- [ ] Base de données sécurisée (PostgreSQL + SSL)
- [ ] SMS Gateway (Twilio/AWS SNS)
- [ ] JWT + refresh tokens
- [ ] Rate limiting (Redis)
- [ ] HTTPS (Let's Encrypt/Cloudflare)
- [ ] Logs centralisés (ELK Stack)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Tests unitaires + intégration
- [ ] Pentest + audit sécurité
- [ ] Documentation API (Swagger)
- [ ] Conformité RGPD + lois CI
- [ ] Backup automatisé (quotidien)
- [ ] Plan de reprise (DRP)

---

**🎉 Documentation technique complète !**

*Sika-Santé — Système d'Authentification Multi-Profils*
