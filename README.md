# VG-Timing

🏁 **Application de chronométrage professionnel** - Solution complète pour la gestion de courses et le chronométrage en temps réel avec intégration CrossMgr.

[![Version](https://img.shields.io/badge/version-0.0.4-blue.svg)](package.json)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-29.4.6-47848F.svg)](https://electronjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Better--SQLite3-003B57.svg)](https://github.com/WiseLibs/better-sqlite3)

---

## 📋 Table des matières

- [🎯 Aperçu](#-aperçu)
- [✨ Fonctionnalités principales](#-fonctionnalités-principales)
- [🖥️ Captures d'écran](#️-captures-décran)
- [🚀 Installation et démarrage](#-installation-et-démarrage)
- [📖 Guide d'utilisation](#-guide-dutilisation)
- [🔧 Architecture technique](#-architecture-technique)
- [🏗️ Structure du projet](#️-structure-du-projet)
- [🛠️ Technologies utilisées](#️-technologies-utilisées)
- [📜 Scripts disponibles](#-scripts-disponibles)
- [🔌 Intégration CrossMgr](#-intégration-crossmgr)
- [📊 Base de données](#-base-de-données)
- [🚀 Contribution et développement](#-contribution-et-développement)
- [📞 Support](#-support)

---

## 🎯 Aperçu

VG-Timing est une application de bureau moderne développée avec **Electron** et **React**, spécialement conçue pour la gestion professionnelle de courses et le chronométrage en temps réel. 

**Caractéristiques clés :**
- Interface moderne et intuitive avec navigation par sidebar
- Intégration native avec **CrossMgr** via TCP (port 53135)
- Base de données SQLite locale haute performance
- Chronométrage temps réel avec détection automatique RFID/EPC
- Export des résultats (CSV, PDF)
- Gestion complète des participants et courses

---

## ✨ Fonctionnalités principales

### 🏁 **Gestion des Courses**
- ✅ **Création et édition** de courses avec paramètres détaillés
- ✅ **Types de courses** : Tours (laps) ou Temps (time-based)
- ✅ **Statuts avancés** : Brouillon → Prêt → En cours → Terminer → Archivé
- ✅ **Catégories de participants** (Senior, Junior, Elite, etc.)
- ✅ **Dashboard de course** avec statistiques en temps réel

### 👥 **Gestion des Participants**
- ✅ **Ajout/édition** de participants avec numéro de dossard unique
- ✅ **Support des tags EPC/RFID** pour détection automatique
- ✅ **Import/Export** de listes de participants (CSV)
- ✅ **Gestion par équipes** et catégories
- ✅ **Validation des données** (email, numéros de dossard)

### ⏱️ **Chronométrage Temps Réel**
- ✅ **Interface de chronométrage** professionnelle
- ✅ **Détection automatique** des passages via CrossMgr (RFID/EPC)
- ✅ **Affichage en grille ou liste** des résultats
- ✅ **Tri dynamique** : position, meilleur tour, dernier passage
- ✅ **Statuts participants** : DNS, DNF, Running, Finished
- ✅ **Chronométrage précis** au millième de seconde
- ✅ **Calcul automatique des positions** et classements

### 📊 **Analyse et Export**
- ✅ **Statistiques de course** en temps réel
- ✅ **Export des résultats** (CSV avec temps détaillés)
- ✅ **Export des participants** pour réutilisation
- ✅ **Classements par catégorie**
- ✅ **Historique des passages** avec temps intermédiaires

### 🔌 **Intégration CrossMgr**
- ✅ **Connexion TCP automatique** (127.0.0.1:53135)
- ✅ **Réception temps réel** des passages RFID
- ✅ **Envoi de GT (Get Time)** pour synchronisation
- ✅ **Gestion automatique des reconnexions**
- ✅ **Journal d'activité** CrossMgr intégré

### 📰 **Actualités et Monitoring**
- ✅ **Flux d'actualités** intégré à l'application
- ✅ **Journal d'activité** complet avec niveaux de log
- ✅ **Notifications** des événements importants
- ✅ **Monitoring des performances** système

### ⚙️ **Configuration et Paramètres**
- ✅ **Paramètres généraux** de l'application
- ✅ **Configuration CrossMgr** (host, port, timeouts)
- ✅ **Gestion des préférences** utilisateur
- ✅ **Thème et apparence** personnalisables

---

## 🖥️ Captures d'écran

*🚧 Section à compléter avec des captures d'écran de l'application*

- Interface principale avec sidebar navigation
- Écran de gestion des courses
- Interface de chronométrage temps réel
- Configuration CrossMgr
- Export des résultats

---

## 🚀 Installation et démarrage

### Prérequis
- **Node.js** 16.x ou supérieur
- **npm** ou **yarn**
- **Git** (pour le développement)
- **CrossMgr** (optionnel, pour l'intégration RFID)

### Installation

```bash
# Cloner le repository
git clone https://github.com/guillaumevd/vgtiming.git
cd vgtiming/app

# Installer les dépendances
npm install

# Reconstruire les modules natifs pour Electron
npm run rebuild
```

### Démarrage en mode développement

```bash
# Lancer en mode développement (React + Electron)
npm start
# ou
npm run dev
```

L'application se lance automatiquement avec :
- **React DevServer** sur `http://localhost:3000`
- **Electron** en mode développement
- **Hot reload** activé pour React
- **Base de données SQLite** en mode développement

### Construction pour production

```bash
# Construire l'application pour production
npm run build
```

Cela génère :
- **Application packagée** dans `/dist`
- **Installeur Windows** (`.exe`)
- **Fichiers de mise à jour** automatique

---

## 📖 Guide d'utilisation

### 1. **Premier lancement**
1. Lancez l'application VG-Timing
2. La base de données SQLite est automatiquement créée
3. Accédez aux **Paramètres** pour configurer CrossMgr (optionnel)

### 2. **Créer une course**
1. Allez dans **Courses** → **Nouvelle course**
2. Remplissez les informations : nom, date, type (Tours/Temps)
3. Configurez les paramètres : durée, nombre de tours, catégories
4. Sauvegardez la course (statut : Brouillon)

### 3. **Ajouter des participants**
1. Sélectionnez votre course → **Gérer participants**
2. Ajoutez manuellement ou importez un fichier CSV
3. Assignez les **numéros de dossard** et **tags EPC** (si RFID)
4. Configurez les **catégories** et équipes

### 4. **Démarrer le chronométrage**
1. Mettez la course au statut **Prêt**
2. Allez dans **Chronométrage**
3. Sélectionnez la course active
4. **Initialiser** le chronométrage
5. **Démarrer** la course (envoie GT à CrossMgr si connecté)

### 5. **Chronométrage en cours**
- Les passages sont **automatiquement détectés** via CrossMgr
- **Interface temps réel** : positions, temps au tour, classement
- **Statuts** : Running, DNS, DNF, Finished
- **Actions manuelles** : ajout passage, changement statut

### 6. **Terminer et exporter**
1. **Terminer la course** quand tous les participants ont fini
2. **Exporter les résultats** en CSV
3. **Archiver** la course pour historique

---

## 🔧 Architecture technique

### **Architecture globale**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│ Electron Main   │◄──►│   CrossMgr      │
│   (Renderer)     │    │   (Backend)     │    │   (TCP 53135)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌─────▼──────┐         ┌─────▼──────┐
    │ UI/UX   │            │  SQLite    │         │   RFID     │
    │Components│           │  Database  │         │  Hardware  │
    └─────────┘            └────────────┘         └────────────┘
```

### **Stack technique**

#### **Frontend (React)**
- **React 18.2** avec Hooks et Context API
- **React Router 6** pour la navigation SPA
- **Styled Components** pour le styling
- **Bootstrap 5** pour les composants UI
- **Framer Motion** pour les animations
- **FontAwesome** pour les icônes

#### **Backend (Electron + Node.js)**
- **Electron 29.4** (Main Process + Renderer)
- **Better-SQLite3** pour la base de données
- **Winston** pour les logs
- **Joi** pour la validation des données
- **ExcelJS** pour l'export Excel
- **UUID** pour les identifiants uniques

#### **Communication**
- **IPC (Inter-Process Communication)** entre React et Electron
- **TCP Socket** pour CrossMgr (127.0.0.1:53135)
- **EventEmitter** pour la gestion des événements
- **Context API** pour l'état global React

### **Patterns et principes**
- **MVC** : Modèles, Contrôleurs, Services séparés
- **Repository Pattern** : Abstraction de la couche données
- **Event-Driven** : Communication par événements
- **Dependency Injection** : Services injectés dans contrôleurs
- **Single Responsibility** : Un fichier = une responsabilité

---

## 🏗️ Structure du projet

```
vgtiming/app/
├── 📁 app/                          # Backend Electron (Main Process)
│   ├── app.js                      # Point d'entrée principal
│   ├── backend.js                  # Orchestrateur backend
│   ├── backend/
│   │   ├── controllers/            # Contrôleurs MVC
│   │   │   ├── raceController.js
│   │   │   ├── participantController.js
│   │   │   ├── timingController.js
│   │   │   ├── crossmgrController.js
│   │   │   └── settingsController.js
│   │   ├── database/               # Couche base de données
│   │   │   ├── database.js         # Manager SQLite
│   │   │   └── migrations/         # Scripts de migration
│   │   ├── models/                 # Modèles de données
│   │   │   ├── Race.js
│   │   │   ├── Participant.js
│   │   │   ├── TimingData.js
│   │   │   └── Settings.js
│   │   ├── services/               # Services métier
│   │   │   ├── raceService.js
│   │   │   ├── participantService.js
│   │   │   ├── timingService.js
│   │   │   ├── crossmgrService.js
│   │   │   └── appLogService.js
│   │   ├── handlers/               # Gestionnaires IPC
│   │   │   └── ipcHandlers.js
│   │   └── utils/                  # Utilitaires backend
│   │       ├── logger.js           # Winston logger
│   │       ├── validation.js       # Joi validation
│   │       └── helpers.js
│   └── windows/                    # Fenêtres Electron
│       ├── main.js                 # Fenêtre principale
│       ├── preload.js              # Script preload sécurisé
│       └── update.js               # Fenêtre de mise à jour
├── 📁 src/                          # Frontend React (Renderer Process)
│   ├── pages/                      # Pages principales
│   │   ├── home/                   # 🏠 Tableau de bord
│   │   ├── races/                  # 🏁 Gestion courses
│   │   │   └── components/         # Composants course
│   │   │       ├── RaceList.js
│   │   │       ├── AddRace.js
│   │   │       ├── RaceEdit.js
│   │   │       ├── Participants.js
│   │   │       └── RaceDashboard.js
│   │   ├── timing/                 # ⏱️ Chronométrage
│   │   │   └── components/         # Composants timing
│   │   ├── news/                   # 📰 Actualités
│   │   └── settings/               # ⚙️ Configuration
│   │       └── components/
│   │           ├── GeneralSettings.js
│   │           ├── CrossMgrConnection.js
│   │           └── LogWindow.js
│   ├── components/                 # Composants réutilisables
│   │   └── TitleBar/               # Barre de titre custom
│   ├── context/                    # Contexts React
│   │   ├── AppContext.js           # État global app
│   │   └── CrossMgrContext.js      # État CrossMgr
│   ├── utils/                      # Utilitaires frontend
│   │   ├── apiUtils.js
│   │   ├── dataUtils.js
│   │   ├── timeUtils.js
│   │   └── notifications.js
│   ├── assets/                     # Ressources statiques
│   │   ├── css/, fonts/, svg/
│   ├── constants/                  # Constantes app
│   └── Sidebar/                    # Navigation latérale
├── 📁 public/                       # Fichiers statiques
│   ├── index.html
│   ├── splash.html                 # Écran de démarrage
│   └── assets/                     # Images, icônes, CSS
└── 📁 build/                        # Build de production (généré)
```

---

## 🛠️ Technologies utilisées

### **🎯 Core Stack**
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Electron** | `^29.4.6` | Runtime desktop cross-platform |
| **React** | `^18.2.0` | Interface utilisateur moderne |
| **Better-SQLite3** | `^12.2.0` | Base de données locale haute performance |
| **React Router** | `^6.10.0` | Routage SPA côté client |

### **🎨 Interface & Styling**
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Bootstrap** | `^5.2.3` | Framework CSS et composants |
| **Styled Components** | `^5.3.9` | CSS-in-JS avec thème |
| **Framer Motion** | `^10.10.0` | Animations fluides |
| **FontAwesome** | `^7.0.0` | Icônes professionnelles |

### **⚙️ Backend & Data**
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Winston** | `^3.17.0` | Logging avancé multi-niveau |
| **Joi** | `^18.0.0` | Validation de données robuste |
| **ExcelJS** | `^4.4.0` | Export Excel/CSV |
| **UUID** | `^11.1.0` | Identifiants uniques |
| **Moment.js** | `^2.29.4` | Gestion dates/temps |

### **🔧 Development & Build**
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Electron Builder** | `^25.1.7` | Packaging multi-plateforme |
| **React Scripts** | `^5.0.1` | Toolchain React optimisée |
| **Concurrently** | `^8.0.1` | Processus parallèles dev |
| **Cross-env** | `^7.0.3` | Variables d'environnement |

---

## 📜 Scripts disponibles

```bash
# 🚀 Développement
npm start                    # Lance React + Electron en mode dev
npm run dev                  # Alias pour npm start

# 🏗️ Build et distribution
npm run build               # Build complet production + increment version
npm run rebuild             # Reconstruction modules natifs pour Electron

# 🔧 Maintenance
npm run test                # Tests unitaires (si configurés)
npm run lint                # Analyse code ESLint
```

**Processus de développement :**
```bash
npm start
```
1. **React DevServer** démarre sur `localhost:3000`
2. **Electron** attend que React soit prêt
3. **Hot reload** activé pour le développement rapide
4. **Base SQLite** créée automatiquement en local

---

## 🔌 Intégration CrossMgr

### **Qu'est-ce que CrossMgr ?**
CrossMgr est un logiciel de chronométrage RFID professionnel pour courses cyclistes, triathlons, courses à pied, etc. VG-Timing s'interface avec CrossMgr pour recevoir automatiquement les temps de passage des participants équipés de puces RFID/EPC.

### **Configuration de l'intégration**

#### **1. Paramètres de connexion**
- **Host :** `127.0.0.1` (localhost)
- **Port :** `53135` (port standard CrossMgr)
- **Protocole :** TCP Socket
- **Mode :** Client/Serveur bidirectionnel

#### **2. Fonctionnalités supportées**
✅ **Réception automatique** des passages RFID  
✅ **Envoi de GT (Get Time)** pour synchronisation horloge  
✅ **Reconnexion automatique** en cas de perte de connexion  
✅ **Gestion des erreurs** et logging des événements  
✅ **Test de connexion** depuis l'interface  

#### **3. Format des données reçues**
```javascript
// Passage d'un participant
{
  epcTag: "E2001122334455667788",
  bibNumber: 101,
  passingTime: "2025-08-11T14:30:25.123Z",
  raceId: "race-uuid",
  source: "crossmgr"
}

// GT (Get Time) envoyé
{
  command: "GT",
  timestamp: "2025-08-11T14:00:00.000Z",
  raceId: "race-uuid"
}
```

#### **4. États de connexion**
- 🔴 **Déconnecté** : Aucune connexion active
- 🟡 **Connexion en cours** : Tentative de connexion
- 🟢 **Connecté** : Prêt à recevoir des données
- 🟠 **Reconnexion** : Tentative de reconnexion automatique

### **Workflow avec CrossMgr**

1. **Préparation**
   - Configurer les participants avec leurs **tags EPC**
   - Vérifier la connexion CrossMgr dans **Paramètres**

2. **Démarrage de course**
   - Initialiser le chronométrage dans VG-Timing
   - Le **GT (Get Time)** est automatiquement envoyé à CrossMgr
   - CrossMgr synchronise son horloge de référence

3. **Chronométrage actif**
   - CrossMgr détecte les passages RFID
   - VG-Timing reçoit les données **en temps réel**
   - Calculs automatiques : positions, tours, temps

4. **Fin de course**
   - Les résultats finaux sont automatiquement calculés
   - Export possible vers Excel/CSV

---

## 📊 Base de données

### **Architecture SQLite**
VG-Timing utilise **Better-SQLite3** pour des performances optimales avec une base de données locale.

#### **Tables principales**
```sql
-- 🏁 Courses
races (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT CHECK(type IN ('laps', 'time')),
  status TEXT DEFAULT 'draft',
  maxLaps INTEGER,
  duration INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- 👥 Participants  
participants (
  id TEXT PRIMARY KEY,
  raceId TEXT REFERENCES races(id),
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  team TEXT,
  category TEXT,
  epcTag TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- ⏱️ Données de chronométrage
timing_data (
  id TEXT PRIMARY KEY,
  raceId TEXT REFERENCES races(id),
  participantId TEXT REFERENCES participants(id),
  bibNumber INTEGER,
  status TEXT DEFAULT 'registered',
  startTime DATETIME,
  finishTime DATETIME,
  totalTime INTEGER,
  position INTEGER,
  passings TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- ⚙️ Paramètres application
settings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### **Migrations automatiques**
Le système de migration automatique s'exécute au démarrage :
- **001_create_races.js** - Table des courses
- **002_create_participants.js** - Table des participants  
- **003_create_timing_data.js** - Données chronométrage
- **004_create_settings.js** - Paramètres app
- **005_adjust_participants.js** - Ajustements participants

#### **Localisation de la base**
```
Windows: %USERPROFILE%\AppData\Roaming\vg-timing\database\vgtiming.db
macOS:   ~/Library/Application Support/vg-timing/database/vgtiming.db
Linux:   ~/.config/vg-timing/database/vgtiming.db
```

---

## 🚀 Contribution et développement

### **Configuration de l'environnement de développement**

#### **Prérequis**
- **Node.js** 16.x+ avec npm/yarn
- **Git** pour la gestion de version
- **CrossMgr** (optionnel) pour tests d'intégration
- **IDE** recommandé : VS Code avec extensions React/Electron

#### **Installation**
```bash
# 1. Clone et installation
git clone https://github.com/guillaumevd/vgtiming.git
cd vgtiming/app
npm install

# 2. Reconstruction modules natifs
npm run rebuild

# 3. Lancement développement
npm start
```

### **Structure de développement**

#### **Backend (Main Process)**
```javascript
// Structure type d'un contrôleur
class RaceController {
  constructor(raceService) {
    this.raceService = raceService;
  }
  
  async createRace(raceData) {
    try {
      const race = await this.raceService.createRace(raceData);
      return { success: true, data: race };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

#### **Frontend (Renderer Process)**
```javascript
// Communication avec le backend via IPC
const createRace = async (raceData) => {
  return await window.VGTiming.createRace(raceData);
};
```

### **Patterns utilisés**
- **MVC** : Séparation Modèles/Vues/Contrôleurs
- **Repository Pattern** : Abstraction données
- **Dependency Injection** : Services injectés
- **Event-Driven** : Communication événementielle
- **Context Pattern** : État global React

### **Guidelines de contribution**
1. **Fork** le projet
2. **Créer une branche** feature (`git checkout -b feature/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir une Pull Request**

### **Standards de code**
- **ES6+** avec async/await
- **JSDoc** pour la documentation des fonctions
- **Error handling** systématique
- **Logging** avec Winston (niveaux: debug, info, warn, error)
- **Validation** avec Joi côté backend

---

## 📞 Support

### **🐛 Rapporter un bug**
1. **Vérifiez** que le bug n'est pas déjà rapporté dans [Issues](https://github.com/guillaumevd/vgtiming/issues)
2. **Créez un issue** avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Version de l'application
   - Système d'exploitation
   - Logs d'erreur (si disponibles)

### **💡 Demander une fonctionnalité**
1. **Ouvrez un issue** avec le label `enhancement`
2. **Décrivez** le besoin et le cas d'usage
3. **Proposez** une solution si possible

### **📧 Contact**
- **Auteur :** Guillaume Vandriessche
- **Email :** guillaumevandriessche776@gmail.com
- **GitHub :** [@guillaumevd](https://github.com/guillaumevd)
- **Repository :** [vgtiming](https://github.com/guillaumevd/vgtiming)

### **📚 Documentation**
- **README.md** : Cette documentation
- **Code comments** : JSDoc dans le code source
- **Architecture** : Diagrammes dans `/docs` (à venir)

---

## 📝 Changelog et Versions

### **Version actuelle : 0.0.4**

#### **🆕 Fonctionnalités récentes**
- ✅ Interface de chronométrage temps réel complète
- ✅ Intégration CrossMgr stable avec reconnexion automatique
- ✅ Export CSV des résultats et participants
- ✅ Gestion complète des statuts de course
- ✅ Dashboard de course avec statistiques
- ✅ Journal d'activité et logging avancé

#### **🔄 Prochaines versions**
- 🚧 **0.0.5** : Interface d'export PDF des résultats
- 🚧 **0.1.0** : Version beta avec tests utilisateurs
- 🚧 **1.0.0** : Version stable de production

---

## 📄 Licence

Ce projet est développé par **Guillaume Vandriessche** et est actuellement en développement privé.

**Copyright © 2025 Guillaume Vandriessche - Tous droits réservés**

---

*Développé avec ❤️ pour la communauté du chronométrage sportif*

**VG-Timing** - *La solution moderne pour le chronométrage professionnel*

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
