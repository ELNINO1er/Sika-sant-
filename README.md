# 🏥 Sika-Santé — Carnet de Santé Numérique Universel

> Plateforme nationale de santé numérique de Côte d'Ivoire

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-purple.svg)](https://getbootstrap.com/)
[![Status](https://img.shields.io/badge/status-demo-orange.svg)](https://github.com)

---

## 📋 Vue d'ensemble

**Sika-Santé** (Santé précieuse) est une plateforme de **carnet de santé numérique universel** conçue pour la Côte d'Ivoire. Le projet propose un **système d'authentification multi-profils sécurisé** avec trois niveaux d'accès :

- 🩺 **Patient** — Connexion par OTP/SMS
- 👨‍⚕️ **Professionnel de Santé** — Authentification + MFA (2FA)
- 🏛️ **Institution / État** — Accès renforcé avec audit trail

---

## ✨ Fonctionnalités

### 🔐 Authentification Sécurisée
- ✅ OTP par SMS pour les patients (simulation)
- ✅ Authentification à 2 facteurs (MFA) pour les professionnels
- ✅ Accès institutionnel renforcé avec journalisation
- ✅ Limitation des tentatives (3-5 selon profil)
- ✅ Expiration des codes (5 minutes)
- ✅ Masquage des données sensibles

### 🎨 Interface Utilisateur
- ✅ Design moderne et responsive (Bootstrap 5)
- ✅ Animations AOS (Animate On Scroll)
- ✅ Inputs OTP avec auto-focus
- ✅ Messages d'erreur clairs
- ✅ Compte à rebours pour renvoi de code

### 🛡️ Sécurité
- ✅ Validation côté client (format CMU, email, ID institutionnel)
- ✅ Tentatives limitées par profil
- ✅ Audit trail pour institutions
- ✅ Alertes de sécurité automatiques
- ✅ Tokens JWT (simulation)

---

## 🚀 Démarrage Rapide

### 1. Cloner le Projet

```bash
git clone https://github.com/votre-repo/Sika-sant-.git
cd Sika-sant-
```

### 2. Ouvrir dans un Navigateur

```bash
# Ouvrir index.html dans votre navigateur
# OU utiliser Live Server (VS Code)
```

### 3. Tester la Connexion

1. Cliquer sur **"Se connecter"** (en haut à droite)
2. Choisir un profil : Patient, Professionnel ou Institution
3. Utiliser les comptes de test (voir [COMPTES_TEST.md](COMPTES_TEST.md))
4. Les codes OTP/MFA sont affichés dans la **console du navigateur** (F12)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**GUIDE_CONNEXION.md**](GUIDE_CONNEXION.md) | Guide utilisateur complet avec parcours détaillés |
| [**COMPTES_TEST.md**](COMPTES_TEST.md) | Liste des comptes de test et scénarios |
| [**IMPLEMENTATION_TECHNIQUE.md**](IMPLEMENTATION_TECHNIQUE.md) | Documentation technique pour développeurs |

---

## 🔑 Comptes de Test Rapides

### Patient (OTP)
- CMU : `1234567890`
- Code OTP : Voir console navigateur (F12)

### Professionnel (Auth + MFA)
- Email : `dr.kouassi@chu-abidjan.ci`
- Mot de passe : `Password123!`
- Code MFA : Voir console navigateur (F12)

### Institution (Accès Renforcé)
- Institution : Ministère de la Santé
- ID : `GOV-MSANTE-1001`
- Mot de passe : `SecureGov2024!@#`
- Code MFA : Voir console navigateur (F12)

**⚠️ Note** : Les codes sont affichés dans la console car il s'agit d'une **démo sans backend réel**.

---

## 📁 Structure du Projet

```
Sika-sant-/
├── index.html                          # Page d'accueil
├── connexion.html                      # Sélection de profil
├── connexion-patient.html              # Authentification patient
├── connexion-professionnel.html        # Authentification professionnel
├── connexion-institution.html          # Authentification institution
│
├── assets/
│   ├── css/
│   │   └── style.css                   # Styles personnalisés
│   ├── js/
│   │   ├── custom.js                   # Scripts généraux
│   │   ├── auth-patient.js             # Logique auth patient
│   │   ├── auth-professionnel.js       # Logique auth professionnel
│   │   └── auth-institution.js         # Logique auth institution
│   ├── images/                         # Images et logos
│   └── vendors/                        # Bibliothèques externes
│
├── GUIDE_CONNEXION.md                  # Documentation utilisateur
├── COMPTES_TEST.md                     # Comptes de test
├── IMPLEMENTATION_TECHNIQUE.md         # Doc technique
└── README.md                           # Ce fichier
```

---

## 🛠️ Technologies

### Frontend
- **Bootstrap 5** — Framework CSS responsive
- **AOS** — Animations on scroll
- **JavaScript Vanilla** — Logique d'authentification
- **Bootstrap Icons** — Icônes

### Simulation
- **sessionStorage** — Stockage temporaire OTP/MFA
- **localStorage** — Stockage tokens après connexion
- **Console logs** — Affichage codes de test

---

## 🔧 Passer en Production

Cette version est une **démo frontend** avec simulations. Pour un déploiement réel :

### Backend Requis
1. **API REST** (Node.js, Python, PHP)
2. **Base de données** (PostgreSQL + chiffrement)
3. **SMS Gateway** (Twilio, AWS SNS)
4. **JWT** avec refresh tokens
5. **Rate limiting** (Redis)
6. **Logs centralisés** (ELK Stack)
7. **Monitoring** (Prometheus, Grafana)

### Sécurité Production
- ✅ HTTPS obligatoire
- ✅ Rate limiting par IP
- ✅ Hashing mots de passe (bcrypt/argon2)
- ✅ Validation backend stricte
- ✅ Audit trail complet
- ✅ Pentest + audit sécurité
- ✅ Conformité RGPD + lois CI

Voir [IMPLEMENTATION_TECHNIQUE.md](IMPLEMENTATION_TECHNIQUE.md) pour les détails.

---

## 🧪 Tests

### Scénarios de Test Disponibles

1. ✅ Connexion Patient réussie
2. ✅ Code OTP expiré
3. ✅ Trop de tentatives (blocage)
4. ✅ Professionnel avec MFA
5. ✅ Institution bloquée après 3 échecs
6. ✅ Renvoi de code OTP/MFA
7. ✅ Validation format inputs

Voir [COMPTES_TEST.md](COMPTES_TEST.md) pour tous les scénarios.

---

## 📞 Support

**Démo** : Les codes OTP/MFA sont dans la console du navigateur (F12)

**Questions** : Consultez la documentation complète dans les fichiers `.md`

---

## 🤝 Contribution

Ce projet est une démonstration. Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit (`git commit -m 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📄 Licence

- **Template Nova** : Copyright © [Freebiesbug](https://freebiesbug.com/) — [MIT License]
- **Modifications Sika-Santé** : Tous droits réservés

---

## 🎉 Crédits

### Template Original
- **Nova Template** par [ThemeWagon](https://themewagon.com)
- Design : Freebiesbug

### Développement Sika-Santé
- Système d'authentification multi-profils
- Scripts JavaScript personnalisés
- Documentation complète

---

**Développé avec ❤️ pour la santé en Côte d'Ivoire**

*Sika-Santé — Votre santé, accessible partout, en toute sécurité*


