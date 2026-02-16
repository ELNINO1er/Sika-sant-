# 🔑 Comptes de Test — Sika-Santé

## 🩺 Profil PATIENT (OTP/SMS)


### Comment tester :
1. Aller sur [connexion-patient.html](connexion-patient.html)
2. Entrer un numéro CMU
3. Le code OTP s'affiche dans la **console du navigateur** (F12)
4. Copier-coller le code

### Comptes disponibles :

| Numéro CMU | Nom Patient | Téléphone Masqué |
|------------|-------------|------------------|
| **1234567890** | KOUASSI Jean | +225 070 ** ** 67 |
| **0987654321** | KONÉ Marie | +225 070 ** ** 43 |
| **1111111111** | TRAORÉ Ibrahim | +225 070 ** ** 11 |

**Note** : Le code OTP est visible dans la console JavaScript :
```
[SIMULATION] OTP généré pour 1234567890: 123456
```

---

## 👨‍⚕️ Profil PROFESSIONNEL (Auth + MFA)

### Comment tester :
1. Aller sur [connexion-professionnel.html](connexion-professionnel.html)
2. Entrer email + mot de passe
3. Le code MFA s'affiche dans la **console du navigateur** (F12)
4. Copier-coller le code MFA

### Comptes disponibles :

#### 🩺 Médecin
- **Email** : `dr.kouassi@chu-abidjan.ci`
- **Mot de passe** : `Password123!`
- **Rôle** : DOCTOR
- **Spécialité** : Cardiologie
- **Permissions** :
  - ✅ Lecture patient
  - ✅ Écriture consultation
  - ✅ Prescription
  - ✅ Accès historique complet

#### 💉 Infirmier(ère)
- **Email** : `inf.kone@chu-treichville.ci`
- **Mot de passe** : `Nurse2024!`
- **Rôle** : NURSE
- **Service** : Urgences
- **Permissions** :
  - ✅ Lecture patient
  - ✅ Saisie constantes vitales
  - ✅ Accès historique limité

#### 💊 Pharmacien(ne)
- **Email** : `pharm.traore@pharmacie-ci.ci`
- **Mot de passe** : `Pharma456!`
- **Rôle** : PHARMACIST
- **Pharmacie** : Pharmacie Centrale
- **Permissions** :
  - ✅ Lecture ordonnance
  - ✅ Validation ordonnance
  - ✅ Dispensation

**Note** : Le code MFA est visible dans la console :
```
[SIMULATION] Code MFA pour dr.kouassi@chu-abidjan.ci: 654321
```

---

## 💊 Profil PHARMACIE (E-Ordonnance)

### Comment tester :
1. Aller sur [connexion-pharmacie.html](connexion-pharmacie.html)
2. Sélectionner la pharmacie
3. Entrer licence + email + mot de passe
4. Le code MFA s'affiche dans la **console du navigateur** (F12)
5. Copier-coller le code MFA

### Compte disponible :

#### 🏪 Pharmacie Moderne d'Abidjan
- **Pharmacie** : Pharmacie Moderne d'Abidjan
- **Licence Ordre** : `PH-CI-2025`
- **Email** : `pharmacie.moderne@sika-sante.ci`
- **Mot de passe** : `Pharma2025!`
- **Rôle** : PHARMACIEN
- **Fonctionnalités** :
  - ✅ Scanner QR code ordonnance
  - ✅ Validation e-ordonnance
  - ✅ Délivrance médicaments
  - ✅ Détection allergies
  - ✅ Alerte interactions médicamenteuses
  - ✅ Historique délivrances
  - ✅ Audit trail complet

**Note** : Le code MFA est visible dans la console :
```
[SIMULATION] CODE MFA PHARMACIE: 123456
```

**⚠️ Important** :
- La pharmacie ne voit QUE les ordonnances (pas tout l'historique médical)
- Toutes les délivrances sont tracées et auditées
- Les alertes d'allergie s'affichent automatiquement

---

## 🏛️ Profil INSTITUTION (Accès Renforcé)

### Comment tester :
1. Aller sur [connexion-institution.html](connexion-institution.html)
2. Sélectionner institution
3. Entrer ID institutionnel + mot de passe
4. Le code MFA s'affiche dans la **console du navigateur** (F12)
5. Copier-coller le code MFA (⚠️ Seulement 3 tentatives !)

### Comptes disponibles :

#### 🏥 Ministère de la Santé
- **Institution** : Ministère de la Santé
- **ID Institutionnel** : `GOV-MSANTE-1001`
- **Mot de passe** : `SecureGov2024!@#`
- **Niveau d'accès** : FULL_ACCESS
- **Permissions** :
  - ✅ Données anonymisées
  - ✅ Génération rapports
  - ✅ Statistiques nationales
  - ✅ Dashboard épidémiologique
  - ✅ Alertes sanitaires

#### 📡 ARTCI
- **Institution** : ARTCI
- **ID Institutionnel** : `GOV-ARTCI-2001`
- **Mot de passe** : `ArtciSecure2024!`
- **Niveau d'accès** : REGULATORY
- **Contact** : admin@artci.ci

#### 🏦 CNAM-CI
- **Institution** : CNAM-CI
- **ID Institutionnel** : `GOV-CNAM-3001`
- **Mot de passe** : `CnamSecure2024!`
- **Niveau d'accès** : INSURANCE
- **Contact** : support@cnam.ci

**Note** : Le code MFA est visible dans la console :
```
[SIMULATION INSTITUTION] Code MFA pour GOV-MSANTE-1001: 789012
```

⚠️ **ATTENTION** : Les institutions ont seulement **3 tentatives** avant blocage !

---

## 🔒 Sécurité Implémentée

### Limitations par Profil

| Profil | Tentatives Login | Tentatives OTP/MFA | Expiration Code | Renvoi Code |
|--------|-----------------|-------------------|----------------|-------------|
| **Patient** | - | 5 | 5 minutes | 60 secondes |
| **Professionnel** | 5 | 5 | 5 minutes | 60 secondes |
| **Pharmacie** | 5 | 5 | 5 minutes | 60 secondes |
| **Institution** | 3 ⚠️ | 3 ⚠️ | 5 minutes | 90 secondes |

### Fonctionnalités de Sécurité

✅ **Masquage des données sensibles**
- Téléphones : `+225 070 ** ** 67`
- Emails : `dro***@chu-abidjan.ci`

✅ **Expiration des codes**
- Tous les codes OTP/MFA expirent après 5 minutes

✅ **Audit Trail (Institutions)**
- Journalisation complète : IP, date, heure, actions

✅ **Blocage après tentatives**
- Blocage temporaire après échec des tentatives
- Alertes de sécurité automatiques (institutions)

✅ **Validation côté client**
- Format numéro CMU (10 chiffres)
- Format email
- Format ID institutionnel (GOV-XXX-0000)
- Longueur mot de passe (12 caractères min pour institutions)

---

## 🧪 Scénarios de Test

### ✅ Scénario 1 : Connexion Patient Réussie
1. CMU : `1234567890`
2. Console : noter le code OTP
3. Entrer le code
4. ✅ **Succès** : Redirection vers dashboard-patient.html

### ✅ Scénario 2 : Code OTP Expiré
1. CMU : `1234567890`
2. Attendre 5 minutes
3. Entrer un ancien code
4. ❌ **Erreur** : "Le code a expiré. Veuillez en demander un nouveau."

### ✅ Scénario 3 : Trop de Tentatives
1. CMU : `1234567890`
2. Entrer 5 codes incorrects
3. ❌ **Erreur** : "Trop de tentatives. Veuillez demander un nouveau code."

### ✅ Scénario 4 : Professionnel avec MFA
1. Email : `dr.kouassi@chu-abidjan.ci`
2. Mot de passe : `Password123!`
3. Console : noter le code MFA
4. Entrer le code MFA
5. ✅ **Succès** : Redirection vers dashboard-professionnel.html

### ✅ Scénario 5 : Institution Bloquée
1. ID : `GOV-MSANTE-1001`
2. Entrer 3 mots de passe incorrects
3. ❌ **Erreur** : "Compte bloqué. Alerte de sécurité envoyée."
4. Console : voir `[SECURITY ALERT]`

### ✅ Scénario 6 : Pharmacie Scanner Ordonnance
1. Licence : `PH-CI-2025`
2. Email : `pharmacie.moderne@sika-sante.ci`
3. Mot de passe : `Pharma2025!`
4. Console : noter le code MFA
5. Entrer le code MFA
6. ✅ **Succès** : Redirection vers dashboard-pharmacie.html
7. Cliquer "Scanner Ordonnance"
8. Entrer ID : `ORD-2026-00145`
9. ✅ **Succès** : Ordonnance affichée avec alertes

---

## 📋 Checklist de Vérification

### Interface Utilisateur
- [ ] Les 4 cartes de profil sont cliquables (Patient, Pro, Pharmacie, Institution)
- [ ] Navigation "Retour" fonctionne
- [ ] Animations AOS s'affichent correctement
- [ ] Design responsive (mobile/tablette/desktop)

### Fonctionnalités Patient
- [ ] Validation CMU (10 chiffres uniquement)
- [ ] OTP affiché dans console
- [ ] Auto-focus entre les inputs OTP
- [ ] Paste d'un code à 6 chiffres fonctionne
- [ ] Compte à rebours renvoi (60s)
- [ ] Messages d'erreur clairs

### Fonctionnalités Professionnel
- [ ] Validation email
- [ ] Toggle visibilité mot de passe
- [ ] MFA affiché dans console
- [ ] Affichage du rôle
- [ ] Permissions stockées dans localStorage

### Fonctionnalités Pharmacie
- [ ] Dropdown pharmacies fonctionne
- [ ] Validation format licence (PH-CI-XXXX)
- [ ] Auto-format licence en majuscules
- [ ] MFA affiché dans console
- [ ] Scanner modal s'ouvre
- [ ] Validation ID ordonnance
- [ ] Affichage alertes allergies
- [ ] Bouton délivrance fonctionne
- [ ] Audit trail délivrances dans console

### Fonctionnalités Institution
- [ ] Dropdown institutions fonctionne
- [ ] Validation format ID (GOV-XXX-0000)
- [ ] Auto-format ID en majuscules
- [ ] Compte à rebours 90 secondes
- [ ] Audit trail dans console
- [ ] Alertes de sécurité

### Sécurité
- [ ] Limitation des tentatives
- [ ] Expiration des codes (5 min)
- [ ] Masquage téléphone/email
- [ ] Stockage localStorage après connexion
- [ ] Console logs visibles (simulation)

---

## 🐛 Débogage

### Problème : Code OTP/MFA non affiché
**Solution** : Ouvrir la console du navigateur (F12) et chercher :
```
[SIMULATION] OTP généré pour ...
[SIMULATION] Code MFA pour ...
```

### Problème : Redirection ne fonctionne pas
**Solution** : Les pages dashboard-*.html n'existent pas encore. C'est normal pour la démo.

### Problème : Tentatives épuisées
**Solution** : Rafraîchir la page (F5) pour réinitialiser

### Problème : sessionStorage vide
**Solution** : Certains navigateurs bloquent sessionStorage en local. Utiliser un serveur local (Live Server VS Code)

---

## 📞 Support Simulation

**Pour toute question sur la démo** :
- Consultez `GUIDE_CONNEXION.md` pour la documentation complète
- Ouvrez la console navigateur (F12) pour voir les logs de simulation
- Les codes OTP/MFA sont affichés dans la console

---

**🎉 Bonne démonstration !**

*Système de connexion multi-profils Sika-Santé — Version Démo*
