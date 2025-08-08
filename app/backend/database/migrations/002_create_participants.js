/**
 * Migration : Créer la table participants
 */

function up(db) {
  db.exec(`
    CREATE TABLE participants (
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
    )
  `);

  // Index pour améliorer les performances
  db.exec(`
    CREATE UNIQUE INDEX idx_participants_race_number ON participants(raceId, number);
    CREATE INDEX idx_participants_race ON participants(raceId);
    CREATE INDEX idx_participants_name ON participants(name);
    CREATE INDEX idx_participants_category ON participants(category);
  `);
}

function down(db) {
  db.exec(`DROP TABLE IF EXISTS participants`);
}

module.exports = { up, down };
