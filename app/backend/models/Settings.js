class Settings {
  constructor(db) {
    this.db = db;
    this.tableName = 'settings';
  }

  /**
   * Obtenir un paramètre par clé
   */
  get(key) {
    const result = this.db.prepare(`SELECT * FROM settings WHERE key = ?`).get(key);
    if (!result) return null;

    return this.parseValue(result.value, result.type);
  }

  /**
   * Obtenir plusieurs paramètres
   */
  getMultiple(keys) {
    if (!Array.isArray(keys) || keys.length === 0) return {};

    const placeholders = keys.map(() => '?').join(',');
    const results = this.db.prepare(`
      SELECT key, value, type FROM settings WHERE key IN (${placeholders})
    `).all(keys);

    const settings = {};
    results.forEach(result => {
      settings[result.key] = this.parseValue(result.value, result.type);
    });

    return settings;
  }

  /**
   * Obtenir tous les paramètres
   */
  getAll() {
    const results = this.db.prepare(`SELECT * FROM settings ORDER BY key`).all();
    const settings = {};

    results.forEach(result => {
      settings[result.key] = {
        value: this.parseValue(result.value, result.type),
        type: result.type,
        description: result.description,
        updatedAt: result.updatedAt
      };
    });

    return settings;
  }

  /**
   * Obtenir les paramètres par préfixe
   */
  getByPrefix(prefix) {
    const results = this.db.prepare(`
      SELECT * FROM settings WHERE key LIKE ? ORDER BY key
    `).all(`${prefix}%`);

    const settings = {};
    results.forEach(result => {
      settings[result.key] = this.parseValue(result.value, result.type);
    });

    return settings;
  }

  /**
   * Définir un paramètre
   */
  set(key, value, type = null, description = null) {
    // Déterminer le type automatiquement si non fourni
    if (!type) {
      type = this.inferType(value);
    }

    const stringValue = this.stringifyValue(value, type);
    
    // Vérifier si le paramètre existe déjà
    const existing = this.db.prepare(`SELECT key FROM settings WHERE key = ?`).get(key);
    
    if (existing) {
      // Mettre à jour
      const stmt = this.db.prepare(`
        UPDATE settings 
        SET value = ?, type = ?, description = COALESCE(?, description), updatedAt = ?
        WHERE key = ?
      `);
      
      const result = stmt.run(
        stringValue, 
        type, 
        description, 
        new Date().toISOString(),
        key
      );
      
      return result.changes > 0;
    } else {
      // Créer
      const stmt = this.db.prepare(`
        INSERT INTO settings (key, value, type, description, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const now = new Date().toISOString();
      const result = stmt.run(key, stringValue, type, description, now, now);
      
      return result.changes > 0;
    }
  }

  /**
   * Définir plusieurs paramètres
   */
  setMultiple(settings) {
    const updateStmt = this.db.prepare(`
      UPDATE settings 
      SET value = ?, type = ?, updatedAt = ?
      WHERE key = ?
    `);

    const insertStmt = this.db.prepare(`
      INSERT INTO settings (key, value, type, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const existingKeys = this.db.prepare(`
      SELECT key FROM settings WHERE key IN (${Object.keys(settings).map(() => '?').join(',')})
    `).all(Object.keys(settings));

    const existingKeySet = new Set(existingKeys.map(row => row.key));
    
    const transaction = this.db.transaction(() => {
      const now = new Date().toISOString();
      
      Object.entries(settings).forEach(([key, config]) => {
        const value = config.value !== undefined ? config.value : config;
        const type = config.type || this.inferType(value);
        const description = config.description || null;
        const stringValue = this.stringifyValue(value, type);

        if (existingKeySet.has(key)) {
          updateStmt.run(stringValue, type, now, key);
        } else {
          insertStmt.run(key, stringValue, type, description, now, now);
        }
      });
    });

    transaction();
    return true;
  }

  /**
   * Supprimer un paramètre
   */
  delete(key) {
    const result = this.db.prepare(`DELETE FROM settings WHERE key = ?`).run(key);
    return result.changes > 0;
  }

  /**
   * Supprimer plusieurs paramètres
   */
  deleteMultiple(keys) {
    if (!Array.isArray(keys) || keys.length === 0) return 0;

    const placeholders = keys.map(() => '?').join(',');
    const result = this.db.prepare(`
      DELETE FROM settings WHERE key IN (${placeholders})
    `).run(keys);

    return result.changes;
  }

  /**
   * Réinitialiser aux paramètres par défaut
   */
  resetToDefaults() {
    // Supprimer tous les paramètres
    this.db.prepare(`DELETE FROM settings`).run();

    // Réinsérer les paramètres par défaut
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

    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, type, description, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const transaction = this.db.transaction(() => {
      for (const setting of defaultSettings) {
        stmt.run(setting.key, setting.value, setting.type, setting.description, now, now);
      }
    });

    transaction();
    return defaultSettings.length;
  }

  /**
   * Vérifier si un paramètre existe
   */
  has(key) {
    const result = this.db.prepare(`SELECT 1 FROM settings WHERE key = ?`).get(key);
    return !!result;
  }

  /**
   * Obtenir les paramètres de l'application
   */
  getAppSettings() {
    return this.getByPrefix('app.');
  }

  /**
   * Obtenir les paramètres de chronométrage
   */
  getTimingSettings() {
    return this.getByPrefix('timing.');
  }

  /**
   * Obtenir les paramètres d'affichage
   */
  getDisplaySettings() {
    return this.getByPrefix('display.');
  }

  /**
   * Obtenir les paramètres d'export
   */
  getExportSettings() {
    return this.getByPrefix('export.');
  }

  /**
   * Obtenir les paramètres de sauvegarde
   */
  getBackupSettings() {
    return this.getByPrefix('backup.');
  }

  /**
   * Obtenir les paramètres de logging
   */
  getLoggingSettings() {
    return this.getByPrefix('logging.');
  }

  /**
   * Parser une valeur selon son type
   */
  parseValue(value, type) {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Convertir une valeur en string selon son type
   */
  stringifyValue(value, type) {
    switch (type) {
      case 'boolean':
        return value ? 'true' : 'false';
      case 'number':
        return value.toString();
      case 'json':
        return JSON.stringify(value);
      case 'string':
      default:
        return value.toString();
    }
  }

  /**
   * Inférer le type d'une valeur
   */
  inferType(value) {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  /**
   * Exporter tous les paramètres
   */
  export() {
    const settings = this.getAll();
    const exportData = {};
    
    Object.entries(settings).forEach(([key, setting]) => {
      exportData[key] = {
        value: setting.value,
        type: setting.type,
        description: setting.description
      };
    });

    return exportData;
  }

  /**
   * Importer des paramètres
   */
  import(settingsData) {
    const settings = {};
    
    Object.entries(settingsData).forEach(([key, setting]) => {
      if (setting.value !== undefined) {
        settings[key] = {
          value: setting.value,
          type: setting.type || this.inferType(setting.value),
          description: setting.description || null
        };
      }
    });

    return this.setMultiple(settings);
  }
}

module.exports = Settings;
