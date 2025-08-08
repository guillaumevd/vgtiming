/**
 * Migration : Créer la table races
 */

function up(db) {
  db.exec(`
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
    )
  `);

  // Index pour améliorer les performances
  db.exec(`
    CREATE INDEX idx_races_status ON races(status);
    CREATE INDEX idx_races_date ON races(date);
    CREATE INDEX idx_races_type ON races(type);
  `);
}

function down(db) {
  db.exec(`DROP TABLE IF EXISTS races`);
}

module.exports = { up, down };
