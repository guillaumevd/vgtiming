# VG-Timing

**Application de chronométrage professionnel** - Une solution complète Electron + React pour la gestion de courses et le chronométrage en temps réel.

[![Version](https://img.shields.io/badge/version-0.0.4-blue.svg)](package.json)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-29.4.6-47848F.svg)](https://electronjs.org/)
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Technologies utilisées](#technologies-utilisées)
- [Scripts disponibles](#scripts-disponibles)
- [Roadmap Production](#roadmap-production)
- [Contribution](#contribution)
- [Support](#support)

## 🎯 Aperçu

VG-Timing est une application de bureau moderne développée avec Electron et React, conçue pour la gestion professionnelle de courses et le chronométrage en temps réel. L'application offre une interface intuitive avec une sidebar de navigation et supporte l'intégration avec CrossMgr.

### Captures d'écran
*(À ajouter)*

## ✨ Fonctionnalités

### 🏁 Gestion des Courses
- **Création et édition** de courses avec informations détaillées
- **Gestion des participants** avec support des tags EPC
- **Statuts de courses** (Brouillon, En cours, Terminée)
- **Export des résultats** dans différents formats

### ⏱️ Chronométrage
- **Interface de chronométrage** en temps réel
- **Affichage en grille ou liste** des résultats
- **Tri automatique** par meilleur tour, dernier tour, etc.
- **Intégration CrossMgr** pour les données RFID

### 📰 Actualités
- **Flux d'actualités** intégré
- **Notifications** des événements importants

### ⚙️ Configuration
- **Paramètres généraux** personnalisables
- **Configuration CrossMgr** avec test de connexion
- **Journal d'activité** en temps réel
- **Thème sombre** optimisé

### 🖥️ Interface
- **Sidebar de navigation** moderne
- **Animations fluides** avec Framer Motion
- **Design responsive** et accessible
- **Fenêtre sans bordure** pour une expérience native

## 🔧 Prérequis

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 ou **yarn** >= 1.22.0
- **Git** pour le clonage du repository

### Systèmes supportés
- Windows 10/11 (64-bit)
- macOS 10.15+ (Intel/Apple Silicon)
- Linux Ubuntu 18.04+ (64-bit)

## 🚀 Installation

### Clonage du repository
```bash
git clone https://github.com/guillaumevd/vgtiming.git
cd vgtiming/app
```

### Installation des dépendances
```bash
# Avec npm
npm install

# Ou avec yarn
yarn install
```

### Configuration
1. Copiez le fichier `.env` si nécessaire
2. Configurez les paramètres dans l'application

## 💻 Utilisation

### Développement
```bash
# Lancement en mode développement
npm run dev
# ou
yarn dev
```
L'application se lance automatiquement avec rechargement à chaud.

### Build de production
```bash
# Construction de l'application
npm run build
# ou
yarn build
```

### Reconstruction des modules natifs
```bash
npm run rebuild
# ou
yarn rebuild
```

## 🏗️ Architecture

### Frontend (Renderer Process)
- **React 18.2.0** avec hooks fonctionnels
- **React Router 6** pour la navigation
- **Styled Components** pour le styling
- **Framer Motion** pour les animations
- **Bootstrap 5** pour les composants UI

### Backend (Main Process)
- **Electron 29.4.6** comme runtime
- **Electron Store** pour la persistance
- **Electron Updater** pour les mises à jour
- **IPC** sécurisé avec contextBridge

### Communication
- **IPC Handlers** pour les API de données
- **Context Bridge** pour l'exposition sécurisée des APIs
- **Event Emitters** pour la communication temps réel

## 📁 Structure du projet

```
vg-timing/
├── app/                          # Dossier principal de l'application
│   ├── app/                      # Main process Electron
│   │   ├── app.js               # Point d'entrée principal
│   │   ├── raceApi.js           # API de gestion des courses
│   │   ├── store.js             # Configuration Electron Store
│   │   └── windows/             # Gestion des fenêtres
│   │       ├── main.js          # Fenêtre principale
│   │       ├── preload.js       # Script de préchargement
│   │       └── update.js        # Fenêtre de mise à jour
│   ├── src/                     # Code source React
│   │   ├── components/          # Composants réutilisables
│   │   │   ├── index.js         # Exports centralisés
│   │   │   └── TitleBar/        # Barre de titre personnalisée
│   │   ├── pages/               # Pages de l'application
│   │   │   ├── home/            # Page d'accueil
│   │   │   ├── timing/          # Interface de chronométrage
│   │   │   ├── races/           # Gestion des courses
│   │   │   │   ├── components/  # Composants spécifiques aux courses
│   │   │   │   └── css/         # Styles des composants
│   │   │   ├── news/            # Page d'actualités
│   │   │   └── settings/        # Configuration
│   │   │       ├── components/  # Composants de configuration
│   │   │       └── css/         # Styles des composants
│   │   ├── Sidebar/             # Navigation latérale
│   │   ├── assets/              # Ressources statiques
│   │   │   ├── css/             # Styles globaux
│   │   │   ├── svg/             # Icônes SVG
│   │   │   └── fonts/           # Polices personnalisées
│   │   ├── constants/           # Constantes de l'application
│   │   ├── logger/              # Système de logging
│   │   ├── utils/               # Utilitaires
│   │   ├── app.js               # Composant principal React
│   │   └── index.js             # Point d'entrée React
│   ├── public/                  # Fichiers publics
│   ├── build/                   # Build de production (généré)
│   ├── package.json             # Configuration npm
│   ├── electron-builder.yml     # Configuration de build Electron
│   └── craco.config.js          # Configuration Create React App
```

## 🛠️ Technologies utilisées

### Core
- **[Electron](https://electronjs.org/)** `^29.4.6` - Framework d'application de bureau
- **[React](https://reactjs.org/)** `^18.2.0` - Bibliothèque UI
- **[React Router](https://reactrouter.com/)** `^6.10.0` - Routage côté client

### Styling & UI
- **[Styled Components](https://styled-components.com/)** `^5.3.9` - CSS-in-JS
- **[Bootstrap](https://getbootstrap.com/)** `^5.2.3` - Framework CSS
- **[Framer Motion](https://framer.com/motion/)** `^10.10.0` - Animations

### Utilities
- **[Electron Store](https://github.com/sindresorhus/electron-store)** `^8.1.0` - Stockage persistant
- **[Moment.js](https://momentjs.com/)** `^2.29.4` - Manipulation des dates
- **[Electron Updater](https://github.com/electron-userland/electron-updater)** `^6.6.2` - Mises à jour automatiques

### Build Tools
- **[Electron Builder](https://www.electron.build/)** `^25.1.7` - Packaging et distribution
- **[React Scripts](https://create-react-app.dev/)** `^5.0.1` - Outils de build React

## 📜 Scripts disponibles

```bash
# Développement
npm run dev                 # Lance l'application en mode développement

# Build
npm run build              # Build de production complet avec auto-increment version
npm run rebuild            # Reconstruction des modules natifs Electron

# Utilitaires
npm install                # Installation des dépendances
npm audit                  # Audit de sécurité des dépendances
```

## 🚨 Roadmap Production

**Status actuel : 3/10 pour la production**

L'application est techniquement solide mais nécessite des améliorations critiques pour un déploiement à grande échelle.

### 🔴 Phase 1 : Critique (Obligatoire)

#### Tests & Qualité
- [ ] **Tests unitaires** - Jest + React Testing Library
  - Couverture de code minimum : 80%
  - Tests des composants critiques
  - Tests des utilitaires et services
- [ ] **Tests d'intégration** - Testing des flux complets
- [ ] **Linting & Formatting** 
  - Réactivation d'ESLint avec configuration stricte
  - Configuration Prettier pour le formatage automatique
  - Pre-commit hooks avec Husky

#### Sécurité
- [ ] **Correction des vulnérabilités** - Fix des 2 vulnérabilités modérées
- [ ] **Audit de sécurité automatisé** - GitHub Security Advisories
- [ ] **Validation des entrées** - Sanitisation côté client et serveur
- [ ] **Permissions Electron** - Restriction des API exposées

#### Logging & Monitoring
- [ ] **Système de logging professionnel** - Winston ou Pino
- [ ] **Monitoring d'erreurs** - Sentry ou équivalent
- [ ] **Métriques de performance** - Collecte et analyse

### 🟡 Phase 2 : Importante

#### Robustesse
- [ ] **Migration TypeScript complète**
  - Types stricts pour tous les composants
  - Interfaces pour les APIs
  - Configuration tsconfig stricte
- [ ] **Gestion d'erreurs robuste**
  - Error Boundaries React
  - Fallbacks UI appropriés
  - Retry automatique pour les opérations critiques
- [ ] **Documentation complète**
  - Documentation API avec JSDoc
  - Guide d'installation détaillé
  - Manuel utilisateur

#### DevOps
- [ ] **CI/CD Pipeline** - GitHub Actions
  - Tests automatiques sur PR
  - Build automatique
  - Déploiement conditionnel
- [ ] **Environnements multiples** - Dev/Staging/Production
- [ ] **Code signing** - Signature des executables

### 🟢 Phase 3 : Recommandée

#### Tests avancés
- [ ] **Tests E2E** - Playwright ou Cypress
- [ ] **Tests de performance** - Benchmarking automatisé
- [ ] **Tests d'accessibilité** - axe-core integration

#### Features Production
- [ ] **Analytics utilisateur** - Métriques d'utilisation anonymisées
- [ ] **System de feedback** - Reporting de bugs intégré
- [ ] **Multi-langue** - i18n complète
- [ ] **Auto-update robuste** - Rollback automatique en cas d'erreur

#### Performance
- [ ] **Optimisation bundle** - Code splitting, lazy loading
- [ ] **Cache intelligent** - Stratégies de mise en cache
- [ ] **Optimisation mémoire** - Profiling et optimisation

### 📊 Métriques de progression

| Catégorie | Actuel | Objectif Production |
|-----------|--------|-------------------|
| Tests | 0% | 80%+ |
| Sécurité | 6/10 | 9/10 |
| Documentation | 2/10 | 8/10 |
| TypeScript | 10% | 95% |
| Performance | 7/10 | 9/10 |
| Monitoring | 1/10 | 8/10 |

### ⏱️ Estimation temporelle
- **Phase 1** : 2-3 semaines (160-200h)
- **Phase 2** : 2-3 semaines (160-200h)  
- **Phase 3** : 3-4 semaines (200-250h)
- **Total** : 7-10 semaines pour une version production-ready

## 🤝 Contribution

### Développement local
1. Fork le repository
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

### Standards de code
- ESLint configuration stricte (à réactiver)
- Prettier pour le formatage
- Tests obligatoires pour les nouvelles features
- Documentation JSDoc pour les fonctions publiques

### Commit Convention
```
type(scope): description

feat(races): add participant import from CSV
fix(timing): correct lap time calculation
docs(readme): update installation instructions
test(components): add RaceList component tests
```

## 📞 Support

### Contact
- **Auteur** : Guillaume Vandriessche
- **Email** : Guillaumevandriessche776@gmail.com
- **Repository** : [github.com/guillaumevd/vgtiming](https://github.com/guillaumevd/vgtiming)

### Issues
Pour signaler un bug ou demander une feature :
1. Vérifiez que l'issue n'existe pas déjà
2. Utilisez les templates fournis
3. Incluez les informations de debug pertinentes

### FAQ

**Q: L'application ne se lance pas en mode développement**
A: Vérifiez que Node.js >= 16 est installé et que toutes les dépendances sont correctement installées avec `npm install`.

**Q: Erreur de compilation React**
A: Effacez le cache avec `rm -rf node_modules package-lock.json` puis `npm install`.

**Q: L'application Electron ne démarre pas**
A: Essayez `npm run rebuild` pour recompiler les modules natifs.

---

## 📄 License

Ce projet est sous licence privée. Tous droits réservés.

---

*Dernière mise à jour : Juillet 2025*
