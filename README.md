# Sika-Santé

Une plateforme de carnet informatisé.

C'est un excellent choix. En Côte d'Ivoire, le **Carnet de Santé Numérique Universel (CSNU)** est le projet qui a le plus fort potentiel pour sauver des vies en temps réel, surtout lors des transferts entre les CHU, les cliniques privées et les centres de santé ruraux.

Voici une structure de **Cahier des Charges (CDC)** simplifiée mais professionnelle pour lancer ce projet.

---

## 📄 Cahier des Charges : Projet "Sika-Santé" (Carnet Numérique)

### 1. Présentation du Projet

* **Nom de code :** Sika-Santé (Santé précieuse).
* **Objectif :** Créer une plateforme centralisée permettant à chaque citoyen ivoirien d'avoir son historique médical accessible via son numéro CMU ou une puce NFC.
* **Problème résolu :** Perte de dossiers papier, redondance d'examens coûteux, erreurs de diagnostic par manque d'historique (allergies, groupe sanguin).

### 2. Spécifications Fonctionnelles (Ce que fait l'appli)

#### A. Côté Patient

* **Profil Médical :** Groupe sanguin, allergies, maladies chroniques (Diabète, Hypertension).
* **Historique des Consultations :** Liste des diagnostics et prescriptions passées.
* **Notifications :** Rappels de vaccination (PEV) et prises de médicaments.

#### B. Côté Personnel de Santé

* **Accès d'Urgence :** Lecture rapide des informations vitales en cas d'inconscience du patient (via QR Code sur une carte ou bracelet).
* **Saisie de Consultation :** Interface simplifiée pour enregistrer les constantes (tension, température, poids).
* **E-Ordonnance :** Génération d'ordonnances sécurisées par QR Code pour éviter les contrefaçons en pharmacie.

#### C. Côté État (Ministère de la Santé)

* **Tableau de bord épidémiologique :** Visualisation en temps réel des foyers de maladies (ex: paludisme) pour une intervention rapide.

### 3. Spécifications Techniques

* **Architecture :** Cloud hybride avec réplication locale (pour pallier les coupures internet).
* **Sécurité :** Chiffrement des données AES-256. L'accès au dossier nécessite un consentement par OTP (code SMS envoyé au patient).
* **Interopérabilité :** Utilisation du standard **HL7 FHIR** pour que le logiciel puisse communiquer avec les machines des hôpitaux (radios, analyses).

### 4. Expérience Utilisateur (UX) & Accessibilité

* **Mode Offline :** Capacité de consulter les données vitales sans connexion internet.
* **Langues :** Interface en Français, avec assistance vocale en **Dioula et Baoulé** pour les patients analphabètes.
* **Support :** Web, Mobile (Android/iOS) et USSD (pour les téléphones classiques "clavier").

---

### 5. Modèle Économique (Pistes de viabilité)

Pour que le projet soit pérenne sans peser sur le patient :

1. **Abonnement B2B :** Les cliniques privées paient pour l'outil de gestion.
2. **Partenariat Assurances :** Réduction des fraudes pour les assureurs, qui paient en échange de l'utilisation de la plateforme.
3. **Subvention Publique :** Intégration dans le budget de la transformation numérique de la Côte d'Ivoire.

---

### 6. Phases de Développement (Feuille de route)

1. **Mois 1-2 :** Prototypage (Design) et validation avec un panel de médecins du CHU d'Angré.
2. **Mois 3-6 :** Développement du MVP (Minimum Viable Product).
3. **Mois 7 :** Phase pilote dans 5 centres de santé à Abidjan.
4. **Mois 12 :** Déploiement national.

---

> **Note importante :** La protection des données est régie en Côte d'Ivoire par l'**ARTCI**. Il faudra impérativement obtenir leur agrément pour le stockage des données à caractère personnel.

