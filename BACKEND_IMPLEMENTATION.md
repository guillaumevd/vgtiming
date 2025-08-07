# Plan de Développement Backend - VG-Timing Application

## 📋 Analyse de l'existant

### ✅ Déjà implémenté :
- Base Electron avec fenêtres principales
- Système de mise à jour automatique
- Store Electron-Store pour la persistance des données
- API basique pour les courses (CRUD)
- Interface frontend moderne et responsive

### ❌ À implémenter :

## 🎯 PHASE 1 : Architecture Backend Robuste

### 1.1 Restructuration du Backend
- **Objectif** : Séparer complètement backend/frontend avec une architecture modulaire
- **Fichiers à créer** :
  ```
  app/backend/
  ├── controllers/
  │   ├── raceController.js
  │   ├── participantController.js
  │   ├── timingController.js
  │   └── settingsController.js
  ├── models/
  │   ├── Race.js
  │   ├── Participant.js
  │   ├── TimingData.js
  │   └── Settings.js
  ├── services/
  │   ├── raceService.js
  │   ├── participantService.js
  │   ├── timingService.js
  │   └── dataExportService.js
  ├── database/
  │   ├── database.js
  │   ├── migrations/
  │   └── seeders/
  ├── utils/
  │   ├── validation.js
  │   ├── helpers.js
  │   └── constants.js
  └── index.js (point d'entrée backend)
  ```

### 1.2 Gestion de Base de Données
- **Technologie** : SQLite avec Better-SQLite3 (plus performant qu'Electron-Store)
- **Schema** : Relations entre courses, participants, et données de chronométrage
- **Migrations** : Système de migration automatique
- **Backup** : Sauvegarde automatique des données

## 🎯 PHASE 2 : Modèles de Données

### 2.1 Modèle Race
```sql
CREATE TABLE races (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  type TEXT NOT NULL,
  duration REAL,
  durationType TEXT,
  maxParticipants INTEGER,
  description TEXT,
  status TEXT DEFAULT 'draft',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Modèle Participant
```sql
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  raceId TEXT NOT NULL,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  team TEXT,
  epcTag TEXT,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raceId) REFERENCES races (id) ON DELETE CASCADE
);
```

### 2.3 Modèle Timing Data
```sql
CREATE TABLE timing_data (
  id TEXT PRIMARY KEY,
  raceId TEXT NOT NULL,
  participantId TEXT NOT NULL,
  lapNumber INTEGER NOT NULL,
  lapTime INTEGER NOT NULL, -- en millisecondes
  timestamp DATETIME NOT NULL,
  isManual BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raceId) REFERENCES races (id) ON DELETE CASCADE,
  FOREIGN KEY (participantId) REFERENCES participants (id) ON DELETE CASCADE
);
```

### 2.4 Modèle Settings
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 PHASE 3 : Services Backend

### 3.1 RaceService
- **Fonctionnalités** :
  - CRUD complet des courses
  - Validation des données
  - Gestion du statut des courses
  - Calcul des statistiques
  - Export des données

### 3.2 ParticipantService
- **Fonctionnalités** :
  - Gestion des participants par course
  - Import/Export de listes de participants
  - Validation des numéros uniques
  - Gestion des catégories et équipes

### 3.3 TimingService
- **Fonctionnalités** :
  - Enregistrement des temps de passage
  - Calcul des temps de tours
  - Classement en temps réel
  - Gestion des tours et écarts
  - Détection des meilleurs temps
  - Gestion manuelle des temps

### 3.4 DataExportService
- **Fonctionnalités** :
  - Export CSV/Excel
  - Export PDF de résultats
  - Templates personnalisables
  - Rapports de course complets

## 🎯 PHASE 4 : API Electron IPC

### 4.1 API Courses
```javascript
// Handlers IPC
'race:getAll'
'race:getById'
'race:create'
'race:update'
'race:delete'
'race:start'
'race:stop'
'race:reset'
'race:finish'
'race:getStats'
```

### 4.2 API Participants
```javascript
'participant:getByRace'
'participant:create'
'participant:update'
'participant:delete'
'participant:toggleActive'
'participant:import'
'participant:export'
```

### 4.3 API Timing
```javascript
'timing:getData'
'timing:addLap'
'timing:updateLap'
'timing:deleteLap'
'timing:getLeaderboard'
'timing:getParticipantStats'
'timing:exportResults'
```

### 4.4 API Settings
```javascript
'settings:get'
'settings:update'
'settings:getAll'
'settings:reset'
```

## 🎯 PHASE 5 : Fonctionnalités Avancées

### 5.1 Système de Backup
- Sauvegarde automatique
- Restore de données
- Export/Import de base complète

### 5.2 Logging et Monitoring
- Logs détaillés des actions
- Monitoring des performances
- Détection d'erreurs

### 5.3 Validation et Sécurité
- Validation de toutes les entrées
- Sanitisation des données
- Gestion des erreurs robuste

### 5.4 Cache et Performance
- Cache des calculs de classement
- Optimisation des requêtes
- Pagination des gros datasets

## 🎯 PHASE 6 : Tests et Documentation

### 6.1 Tests Unitaires
- Tests pour tous les services
- Tests pour les modèles
- Tests d'intégration

### 6.2 Documentation
- Documentation API complète
- Guide de maintenance
- Schéma de base de données

## 🗂️ Structure Finale du Backend

```
app/backend/
├── index.js (Point d'entrée)
├── database/
│   ├── database.js (Configuration SQLite)
│   ├── migrations/
│   │   ├── 001_create_races.js
│   │   ├── 002_create_participants.js
│   │   ├── 003_create_timing_data.js
│   │   └── 004_create_settings.js
│   └── seeders/
│       └── default_settings.js
├── models/
│   ├── Race.js
│   ├── Participant.js
│   ├── TimingData.js
│   └── Settings.js
├── services/
│   ├── raceService.js
│   ├── participantService.js
│   ├── timingService.js
│   ├── settingsService.js
│   ├── backupService.js
│   └── exportService.js
├── controllers/
│   ├── raceController.js
│   ├── participantController.js
│   ├── timingController.js
│   └── settingsController.js
├── utils/
│   ├── validation.js
│   ├── helpers.js
│   ├── logger.js
│   └── constants.js
└── tests/
    ├── services/
    ├── models/
    └── controllers/
```

## ⏱️ Planning d'Implémentation

### Semaine 1
- Phase 1 : Architecture et base de données
- Phase 2 : Modèles de données

### Semaine 2
- Phase 3 : Services backend
- Phase 4 : API IPC

### Semaine 3
- Phase 5 : Fonctionnalités avancées
- Phase 6 : Tests et documentation

## 🔧 Technologies Utilisées

- **Base de données** : SQLite avec Better-SQLite3
- **ORM/Query Builder** : SQL pur pour performance
- **Validation** : Joi ou Zod
- **Tests** : Jest
- **Logging** : Winston
- **Export** : ExcelJS, PDFKit
- **Backup** : Compression avec node-gzip

## ✅ Critères de Réussite

1. **Séparation Backend/Frontend** : 100% découplé
2. **Performance** : < 100ms pour toutes les opérations
3. **Fiabilité** : Gestion d'erreur complète
4. **Scalabilité** : Support de milliers de participants
5. **Maintenabilité** : Code documenté et testé

---

Ce plan garantit un backend robuste, performant et complètement séparé du frontend, prêt pour l'intégration CrossMGR future.
