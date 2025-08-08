/**
 * Migration : Créer la table settings
 */

function up(db) {
  db.exec(`
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'string',
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insérer les paramètres par défaut
  const defaultSettings = [
    { key: 'app.name', value: 'VG-Timing', type: 'string', description: 'Nom de l\'application' },
    { key: 'app.version', value: '1.0.0', type: 'string', description: 'Version de l\'application' },
    { key: 'timing.autoStartEnabled', value: 'false', type: 'boolean', description: 'Démarrage automatique du chronométrage' },
    { key: 'timing.defaultCategory', value: 'Général', type: 'string', description: 'Catégorie par défaut' },
    { key: 'display.theme', value: 'dark', type: 'string', description: 'Thème de l\'interface' },
    { key: 'display.language', value: 'fr', type: 'string', description: 'Langue de l\'interface' },
    { key: 'export.defaultPath', value: '', type: 'string', description: 'Chemin d\'export par défaut' },
    { key: 'backup.autoBackupEnabled', value: 'true', type: 'boolean', description: 'Sauvegarde automatique' },
    { key: 'backup.backupInterval', value: '300', type: 'number', description: 'Intervalle de sauvegarde (secondes)' },
    { key: 'logging.level', value: 'info', type: 'string', description: 'Niveau de logging' }
  ];

  const stmt = db.prepare(`
    INSERT INTO settings (key, value, type, description) 
    VALUES (?, ?, ?, ?)
  `);

  for (const setting of defaultSettings) {
    stmt.run(setting.key, setting.value, setting.type, setting.description);
  }
}

function down(db) {
  db.exec(`DROP TABLE IF EXISTS settings`);
}

module.exports = { up, down };
