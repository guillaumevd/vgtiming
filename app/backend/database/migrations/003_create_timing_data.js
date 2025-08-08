/**
 * Migration : Créer la table timing_data
 */

function up(db) {
  db.exec(`
    CREATE TABLE timing_data (
      id TEXT PRIMARY KEY,
      participantId TEXT NOT NULL,
      raceId TEXT NOT NULL,
      bibNumber INTEGER NOT NULL,
      chipId TEXT,
      passings TEXT, -- JSON string pour stocker les passages
      startTime DATETIME,
      finishTime DATETIME,
      totalTime INTEGER, -- en millisecondes
      status TEXT DEFAULT 'registered',
      position INTEGER,
      category TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (raceId) REFERENCES races(id) ON DELETE CASCADE
    )
  `);

  // Index pour améliorer les performances
  db.exec(`
    CREATE UNIQUE INDEX idx_timing_race_participant ON timing_data(raceId, participantId);
    CREATE INDEX idx_timing_race ON timing_data(raceId);
    CREATE INDEX idx_timing_participant ON timing_data(participantId);
    CREATE INDEX idx_timing_bib ON timing_data(bibNumber);
    CREATE INDEX idx_timing_status ON timing_data(status);
    CREATE INDEX idx_timing_position ON timing_data(position);
  `);
}

function down(db) {
  db.exec(`DROP TABLE IF EXISTS timing_data`);
}

module.exports = { up, down };
