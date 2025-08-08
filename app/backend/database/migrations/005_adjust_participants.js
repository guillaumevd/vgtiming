/**
 * Migration : Ajuster la table participants pour correspondre au frontend
 */

function up(db) {
  // Ajouter les champs manquants
  db.exec(`
    ALTER TABLE participants ADD COLUMN epcTag TEXT;
    ALTER TABLE participants ADD COLUMN isActive BOOLEAN DEFAULT 1;
  `);
  
  // Supprimer les colonnes non utilisées par le frontend
  // SQLite ne supporte pas DROP COLUMN directement, donc on recrée la table
  db.exec(`
    -- Créer une nouvelle table avec la structure correcte
    CREATE TABLE participants_new (
      id TEXT PRIMARY KEY,
      raceId TEXT NOT NULL,
      number INTEGER NOT NULL,
      name TEXT NOT NULL,
      epcTag TEXT,
      category TEXT,
      team TEXT,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (raceId) REFERENCES races(id) ON DELETE CASCADE
    );
    
    -- Copier les données existantes
    INSERT INTO participants_new (id, raceId, number, name, category, team, createdAt, updatedAt, isActive)
    SELECT id, raceId, number, name, category, team, createdAt, updatedAt, 1
    FROM participants;
    
    -- Supprimer l'ancienne table
    DROP TABLE participants;
    
    -- Renommer la nouvelle table
    ALTER TABLE participants_new RENAME TO participants;
  `);

  // Recréer les index
  db.exec(`
    CREATE UNIQUE INDEX idx_participants_race_number ON participants(raceId, number);
    CREATE INDEX idx_participants_race ON participants(raceId);
    CREATE INDEX idx_participants_name ON participants(name);
    CREATE INDEX idx_participants_category ON participants(category);
    CREATE INDEX idx_participants_epc ON participants(epcTag);
  `);
}

function down(db) {
  // Restaurer l'ancienne structure si nécessaire
  db.exec(`
    CREATE TABLE participants_old (
      id TEXT PRIMARY KEY,
      raceId TEXT NOT NULL,
      number INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      team TEXT,
      category TEXT,
      birthYear INTEGER,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (raceId) REFERENCES races(id) ON DELETE CASCADE
    );
    
    INSERT INTO participants_old (id, raceId, number, name, team, category, createdAt, updatedAt)
    SELECT id, raceId, number, name, team, category, createdAt, updatedAt
    FROM participants;
    
    DROP TABLE participants;
    ALTER TABLE participants_old RENAME TO participants;
  `);
}

module.exports = { up, down };
