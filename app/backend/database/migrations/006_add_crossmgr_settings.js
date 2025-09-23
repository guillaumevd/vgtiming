/**
 * Migration : Ajouter les paramètres CrossMgr
 */

function up(db) {
  // Ajouter les paramètres CrossMgr par défaut
  const crossmgrSettings = [
    { key: 'crossmgrHost', value: 'localhost', type: 'string', description: 'Adresse du serveur CrossMgr' },
    { key: 'crossmgrPort', value: '53135', type: 'number', description: 'Port du serveur CrossMgr' },
    { key: 'crossmgrAutoConnect', value: 'false', type: 'boolean', description: 'Connexion automatique à CrossMgr' },
    { key: 'crossmgrAutoStart', value: 'false', type: 'boolean', description: 'Démarrer l\'attente de connexion au lancement' },
    { key: 'crossmgrTimeout', value: '5000', type: 'number', description: 'Délai d\'attente pour les connexions (ms)' },
    { key: 'crossmgrRetryInterval', value: '3000', type: 'number', description: 'Intervalle de reconnexion (ms)' },
    { key: 'crossmgrMaxRetries', value: '5', type: 'number', description: 'Nombre maximum de tentatives de reconnexion' }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, type, description) 
    VALUES (?, ?, ?, ?)
  `);

  for (const setting of crossmgrSettings) {
    stmt.run(setting.key, setting.value, setting.type, setting.description);
  }
}

function down(db) {
  // Supprimer les paramètres CrossMgr
  const crossmgrKeys = [
    'crossmgrHost', 'crossmgrPort', 'crossmgrAutoConnect', 'crossmgrAutoStart',
    'crossmgrTimeout', 'crossmgrRetryInterval', 'crossmgrMaxRetries'
  ];

  const stmt = db.prepare(`DELETE FROM settings WHERE key = ?`);
  for (const key of crossmgrKeys) {
    stmt.run(key);
  }
}

module.exports = { up, down };
