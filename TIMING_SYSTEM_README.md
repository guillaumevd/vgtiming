# 🏁 VG-Timing - Système de Chronométrage avec CrossMgr

## 📋 Table des matières
1. [Architecture du système](#architecture)
2. [Fonctionnement actuel](#fonctionnement-actuel)
3. [Développements nécessaires](#développements-nécessaires)
4. [Guide d'installation CrossMgr](#installation-crossmgr)
5. [Guide de configuration](#configuration)
6. [Plan de développement](#plan-de-développement)
7. [Tests et validation](#tests)

## 🏗️ Architecture du système {#architecture}

### Architecture existante

#### Backend (Node.js + Electron)
```
app/backend/
├── services/
│   ├── crossmgrService.js     # ✅ Service de connexion TCP CrossMgr (127.0.0.1:53135)
│   ├── timingService.js       # ✅ Logique de chronométrage et calculs
│   ├── raceService.js         # ✅ Gestion des courses
│   └── participantService.js  # ✅ Gestion des participants
├── controllers/
│   ├── crossmgrController.js  # ✅ API REST pour CrossMgr
│   ├── timingController.js    # ✅ API REST pour chronométrage
│   └── raceController.js      # ✅ API REST pour courses
├── ipc/
│   ├── crossmgrIPC.js        # ✅ Communication IPC Electron
│   ├── timingIPC.js          # ✅ Communication IPC timing
│   └── raceIPC.js            # ✅ Communication IPC courses
└── database/
    ├── migrations/
    │   ├── 001_create_races.js      # ✅ Table courses
    │   ├── 002_create_participants.js # ✅ Table participants
    │   └── 003_create_timing_data.js  # ✅ Table données chronométrage
    └── models/                # ✅ Modèles SQLite
```

#### Frontend (React)
```
src/
├── context/
│   └── CrossMgrContext.js     # ✅ État global CrossMgr (connecté/déconnecté)
├── pages/timing/
│   ├── index.js              # ✅ Page principale chronométrage
│   ├── components/
│   │   ├── TimingSidebar.js  # ✅ Panneau de contrôle (modifié sans onglets)
│   │   ├── TimingDisplay.js  # ✅ Affichage des résultats
│   │   ├── TimingGrid.js     # ✅ Grille des participants
│   │   └── TimingList.js     # ✅ Liste des participants
│   └── css/Timing.css        # ✅ Styles (récemment optimisés)
└── pages/races/
    └── components/RaceDashboard.js # ✅ Dashboard course avec résultats
```

#### API Frontend
```
public/assets/js/vgtiming-api.js  # ✅ API JavaScript pour communication IPC
```

### Base de données (SQLite)

#### Table `races`
- `id`, `name`, `date`, `time`, `location`, `type`, `duration`, `durationType`, `maxParticipants`
- `description`, `status` (draft/ready/in_progress/finished), `createdAt`, `updatedAt`

#### Table `participants`
- `id`, `raceId`, `firstName`, `lastName`, `email`, `phone`, `team`, `category`
- `bibNumber`, `epcTag`, `isActive`, `createdAt`, `updatedAt`

#### Table `timing_data`
- `id`, `participantId`, `raceId`, `bibNumber`, `chipId`
- `passings` (JSON), `startTime`, `finishTime`, `totalTime`, `status`, `position`
- `category`, `notes`, `createdAt`, `updatedAt`

## 🔧 Fonctionnement actuel {#fonctionnement-actuel}

### ✅ Ce qui fonctionne
1. **Connexion CrossMgr** : Service TCP écoutant sur port 53135
2. **Interface utilisateur** : Page timing avec sidebar sans onglets
3. **Gestion des courses** : CRUD complet avec dashboard
4. **Gestion des participants** : CRUD complet avec comptage correct
5. **État CrossMgr** : Détection connexion/déconnexion en temps réel
6. **Base de données** : Structure complète pour chronométrage

### ❌ Ce qui manque
1. **Intégration frontend-backend timing** : Données timing pas connectées
2. **Bouton "Lancer" non fonctionnel** : Pas de démarrage effectif
3. **Traitement données CrossMgr** : Messages reçus mais pas traités
4. **Calcul automatique des résultats** : Positions, temps, classements
5. **Transition automatique** : Course finie → dashboard résultats
6. **Effet visuel bouton** : Animation clignotante manquante
7. **Sauvegarde temps réel** : Résultats pas persistés

## 🚀 Développements nécessaires {#développements-nécessaires}

### Phase 1 : Connexion Frontend-Backend ⏱️ 2h
- [ ] Connecter `TimingSidebar` au `timingService`
- [ ] Implémenter `initializeRaceTiming()` au clic "Lancer"
- [ ] Afficher données timing dans `TimingDisplay`
- [ ] Mettre à jour compteurs temps réel

### Phase 2 : Traitement CrossMgr ⏱️ 3h
- [ ] Envoyer commande GT (Get Time) au démarrage course
- [ ] Parser messages CrossMgr (format passage participants)
- [ ] Associer messages aux participants par EPC tag
- [ ] Enregistrer passages en base (`timing_data.passings`)
- [ ] Calculer temps intermédiaires et totaux depuis GT départ

### Phase 3 : Interface utilisateur ⏱️ 1h
- [ ] Animation clignotante bouton "Lancer" 
- [ ] Conditions d'activation : course sélectionnée + CrossMgr connecté
- [ ] Feedback visuel états (en cours, terminé)
- [ ] Sons de notification (optionnel)

### Phase 4 : Logique métier ⏱️ 2h
- [ ] Calcul automatique positions par catégorie
- [ ] Détection fin de course (durée OU nb tours)
- [ ] Changement statut course → "finished"
- [ ] Export résultats

### Phase 5 : Navigation automatique ⏱️ 1h
- [ ] Redirection vers dashboard course finie
- [ ] Affichage résultats finaux dans dashboard
- [ ] Historique des courses terminées

## 📦 Installation CrossMgr {#installation-crossmgr}

### Prérequis
- Windows 10/11
- VG-Timing installé et configuré
- Réseau local (si CrossMgr sur machine différente)

### Installation CrossMgr
1. Télécharger CrossMgr depuis [site officiel](https://www.cross-manager.com/)
2. Installer CrossMgr normalement
3. Lancer CrossMgr
4. Créer/ouvrir une course de test

### Configuration CrossMgr pour VG-Timing
1. Dans CrossMgr : `File > Properties`
2. Onglet `RFID` :
   - ☑️ Enable RFID
   - Host: `127.0.0.1` (même machine) ou IP de VG-Timing
   - Port: `53135`
3. Clic `Start RFID`

## ⚙️ Configuration système {#configuration}

### Configuration VG-Timing
1. Lancer VG-Timing
2. Aller dans **Settings** → **CrossMgr Connection**
3. Vérifier paramètres :
   - Host: `127.0.0.1`
   - Port: `53135`
   - Auto-start: ☑️
4. Clic **Démarrer l'écoute**

### Test de connexion
1. Status CrossMgr devrait afficher "En écoute (attente client)"
2. Démarrer CrossMgr RFID → Status devient "Connecté à CrossMgr"
3. Messages de timing apparaissent dans le journal

### Workflow complet
```
1. VG-Timing → Démarrer l'écoute CrossMgr
2. CrossMgr → Configurer RFID + Start RFID  
3. VG-Timing → Créer course + ajouter participants (avec EPC tags)
4. VG-Timing → Page Timing → Sélectionner course
5. VG-Timing → Bouton "Lancer" → Envoie GT (Get Time) à CrossMgr
6. CrossMgr → Simuler/recevoir passages RFID
7. VG-Timing → Voir résultats temps réel (calculés depuis GT)
8. Course termine → Auto-redirect dashboard
```

## 📡 Protocole CrossMgr

### Commandes VG-Timing → CrossMgr
Au démarrage d'une course, VG-Timing envoie :
```
GT
```
Cette commande permet d'obtenir le temps de référence pour calculer les temps de passage.

### Messages CrossMgr → VG-Timing
Quand un participant passe devant le lecteur RFID, CrossMgr envoie :
```
DA3691 01:24:54.543102 10  00000      C7 date=20250811
```

**Format détaillé :**
- `DA3691` : **EPC Tag du participant** (identifiant RFID unique)
- `01:24:54.543102` : **Heure exacte du passage** (HH:MM:SS.microsec)
- `10 00000 C7` : Données techniques (non utilisées par VG-Timing)
- `date=20250811` : Date du passage (YYYYMMDD)

### Calcul des temps
1. **Temps de départ** : Heure du GT envoyé au lancement
2. **Temps de passage** : Heure reçue dans message CrossMgr
3. **Temps écoulé** : `Passage - GT_départ`
4. **Temps au tour** : `Passage_actuel - Passage_précédent`

### Association participant
Les participants doivent avoir leur **EPC tag** configuré dans VG-Timing pour être associés aux passages CrossMgr.

## 🗺️ Plan de développement {#plan-de-développement}

### Sprint 1 : Infrastructure (4h)
**Objectif** : Connecter frontend timing au backend
- Modifier `TimingSidebar.js` pour appeler APIs timing
- Implémenter démarrage course avec `initializeRaceTiming()`
- Connecter `TimingDisplay.js` aux données backend
- Ajouter animation bouton "Lancer"

### Sprint 2 : CrossMgr (4h)  
**Objectif** : Traiter données CrossMgr en temps réel
- Envoyer commande GT au démarrage course dans `crossmgrService.js`
- Parser messages passages (EPC + heure) dans `crossmgrService.js`
- Associer passages aux participants par EPC tag dans `timingService.js`
- Sauvegarder passages dans `timing_data.passings`
- Calculer temps écoulés depuis GT départ et temps au tour

### Sprint 3 : Finalisation (2h)
**Objectif** : Finir course automatiquement
- Détection fin de course (temps/tours)
- Changement statut course → finished
- Navigation automatique vers dashboard
- Affichage résultats finaux

### Jalons
- **Jalon 1** : Bouton Lancer fonctionnel + animation
- **Jalon 2** : Réception données CrossMgr en temps réel  
- **Jalon 3** : Calcul positions et temps
- **Jalon 4** : Fin de course automatique + résultats

## 🧪 Tests et validation {#tests}

### Test manuel basique
1. **Setup** : VG-Timing + CrossMgr connectés
2. **Course** : Créer course test avec 3 participants (avec EPC tags)
3. **Lancer** : Bouton clignote → clic → envoie GT → chronométrage démarre
4. **Données** : Simuler passages CrossMgr → parser EPC+heure → voir temps réel
5. **Calculs** : Vérifier temps écoulés depuis GT et temps au tour
6. **Fin** : Course termine → redirect dashboard → voir résultats

### Test de charge
- 50 participants simultanés
- Messages CrossMgr rapides (< 1 seconde)
- Vérifier performances et stabilité

### Test de robustesse  
- Déconnexion/reconnexion CrossMgr
- Redémarrage VG-Timing en cours de course
- Corruption données → récupération

## 📋 Checklist finale

### Fonctionnalités
- [ ] Bouton "Lancer" fonctionne et clignote
- [ ] Commande GT envoyée au démarrage
- [ ] Messages CrossMgr parsés (EPC + heure)
- [ ] Association participants par EPC tag
- [ ] Calculs temps depuis GT (écoulé + au tour)
- [ ] Positions calculées automatiquement  
- [ ] Fin de course détectée (durée/tours)
- [ ] Navigation automatique dashboard
- [ ] Résultats sauvegardés et affichés

### Interface
- [ ] Animation bouton (ombre clignotante)
- [ ] Feedback états course (ready/running/finished)
- [ ] Temps réel affiché (durée écoulée)
- [ ] Positions participants en live
- [ ] Compteurs mis à jour (tours, passages)

### Technique  
- [ ] APIs timing toutes connectées
- [ ] Commande GT envoyée au démarrage course
- [ ] Messages CrossMgr parsés (format EPC + heure)
- [ ] Association participants par EPC tag
- [ ] Calculs temps précis (écoulé, au tour, positions)
- [ ] Base données timing_data utilisée
- [ ] Gestion erreurs et déconnexions
- [ ] Performance acceptable (>50 participants)

---

## ⚡ Estimation totale : 10 heures de développement

**Ready pour démarrer le développement ?** 🚀

> Ce README sera mis à jour au fur et à mesure du développement avec les détails techniques et les solutions implémentées.
