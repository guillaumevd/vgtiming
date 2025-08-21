// Script de test pour vérifier l'accès aux données de timing
const path = require('path');
const Database = require('better-sqlite3');

// Accès direct à la base de données
const dbPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'vg-timing', 'vg-timing', 'vgtiming.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Test 1: Compter les données de timing
const countResult = db.prepare('SELECT COUNT(*) as count FROM timing_data').get();
console.log('Total timing data records:', countResult.count);

// Test 2: Récupérer les données de timing pour une course spécifique
const raceId = '9d56fb7c-cbb5-4c84-88da-c2e92cbf99a3';
const timingDataQuery = `
  SELECT 
    td.*,
    p.name as participantName,
    p.team as participantTeam,
    p.category as participantCategory
  FROM timing_data td
  LEFT JOIN participants p ON td.participantId = p.id
  WHERE td.raceId = ?
  ORDER BY td.position IS NULL, td.position ASC
`;

const timingData = db.prepare(timingDataQuery).all(raceId);
console.log(`Found ${timingData.length} timing records for race ${raceId}`);

timingData.forEach((record, index) => {
  console.log(`Record ${index + 1}:`, {
    id: record.id,
    participantName: record.participantName,
    bibNumber: record.bibNumber,
    status: record.status,
    passingsLength: record.passings ? JSON.parse(record.passings).length : 0
  });
});

db.close();
