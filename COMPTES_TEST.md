# Comptes de test

Les comptes seedes par `backend/schema.sql` couvrent les 4 roles cibles du produit.

## Credentials

La base locale charge les comptes suivants :

| Role | Identifiant | Valeur |
|---|---|---|
| `PATIENT` | CMU | `1234567890` |
| `PROFESSIONAL` | Email | `dr.kouassi@chu-abidjan.ci` |
| `ADMIN` | Email | `admin@sika-sante.ci` |
| `INSTITUTION` | Institution ID | `GOV-CNAM-3001` |

Mots de passe actuellement configures :

| Role | Mot de passe |
|---|---|
| `PROFESSIONAL` | `ProSika123!45` |
| `ADMIN` | `AdminSika123!45` |
| `INSTITUTION` | `InstSika123!45` |

## Parcours a verifier

### Patient

1. Ouvrir `/pages/connexion-patient.html`
2. Saisir `1234567890`
3. Recuperer le code OTP dans les logs backend hors production
4. Valider puis verifier la redirection vers `/pages/dashboard-patient.html`

### Professionnel

1. Ouvrir `/pages/connexion-professionnel.html`
2. Saisir `dr.kouassi@chu-abidjan.ci`
3. Saisir le mot de passe seed correspondant
4. Recuperer le code MFA dans les logs backend hors production
5. Verifier la redirection vers `/pages/dashboard-professional.html`

### Admin

1. Ouvrir `/pages/connexion-admin.html`
2. Saisir `admin@sika-sante.ci`
3. Saisir le mot de passe seed correspondant
4. Recuperer le code MFA dans les logs backend hors production
5. Verifier la redirection vers `/pages/dashboard-admin.html`

### Institution

1. Ouvrir `/pages/connexion-institution.html`
2. Saisir `GOV-CNAM-3001`
3. Saisir le mot de passe seed correspondant
4. Recuperer le code MFA dans les logs backend hors production
5. Verifier la redirection vers `/pages/dashboard-institution.html`

## Permissions attendues

| Role | Permissions |
|---|---|
| `PATIENT` | aucune permission metier |
| `PROFESSIONAL` | `read_patient`, `write_patient`, `prescribe` |
| `ADMIN` | `read_patient`, `write_patient`, `prescribe`, `view_audit_logs` |
| `INSTITUTION` | `view_audit_logs` |
