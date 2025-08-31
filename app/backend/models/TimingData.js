const { generateId } = require('../utils/helpers');
const { TIMING_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

class TimingData {
  constructor(db) {
    this.db = db;
    this.tableName = 'timing_data';
  }

  /**
   * Créer une nouvelle donnée de chronométrage
   */
  create(timingData) {
    const timing = {
      id: timingData.id || generateId(), // Utiliser l'ID fourni ou générer un nouveau
      participantId: timingData.participantId,
      raceId: timingData.raceId,
      bibNumber: timingData.bibNumber,
      chipId: timingData.chipId || null,
      passings: JSON.stringify(timingData.passings || []),
      startTime: timingData.startTime || null,
      finishTime: timingData.finishTime || null,
      totalTime: timingData.totalTime || null,
      status: timingData.status || TIMING_STATUS.REGISTERED,
      position: timingData.position || null,
      category: timingData.category || null,
      notes: timingData.notes || null,
      createdAt: timingData.createdAt || new Date().toISOString(), // Utiliser la date fournie ou actuelle
      updatedAt: timingData.updatedAt || new Date().toISOString()  // Utiliser la date fournie ou actuelle
    };

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO timing_data (
        id, participantId, raceId, bibNumber, chipId, passings, startTime,
        finishTime, totalTime, status, position, category, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      timing.id, timing.participantId, timing.raceId, timing.bibNumber,
      timing.chipId, timing.passings, timing.startTime, timing.finishTime,
      timing.totalTime, timing.status, timing.position, timing.category,
      timing.notes, timing.createdAt, timing.updatedAt
    );

    if (result.changes > 0) {
      return this.findById(timing.id);
    }
    return null;
  }

  /**
   * Trouver toutes les données de chronométrage d'une course
   */
  findByRace(raceId, options = {}) {
    let query = `
      SELECT 
        td.*,
        p.name as participantName,
        p.team as participantTeam,
        p.category as participantCategory
      FROM timing_data td
      LEFT JOIN participants p ON td.participantId = p.id
      WHERE td.raceId = ?
    `;
    const params = [raceId];

    // Filtres
    const conditions = [];
    if (options.status) {
      conditions.push('td.status = ?');
      params.push(options.status);
    }
    if (options.category) {
      conditions.push('(td.category = ? OR p.category = ?)');
      params.push(options.category, options.category);
    }
    if (options.bibNumber) {
      conditions.push('td.bibNumber = ?');
      params.push(options.bibNumber);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    // Tri
    const orderBy = options.orderBy || 'position';
    const order = options.order || 'ASC';
    
    if (orderBy === 'position') {
      query += ` ORDER BY td.position IS NULL, td.position ${order}`;
    } else if (orderBy === 'totalTime') {
      query += ` ORDER BY td.totalTime IS NULL, td.totalTime ${order}`;
    } else {
      query += ` ORDER BY td.${orderBy} ${order}`;
    }

    const results = this.db.prepare(query).all(params);
    
    // Parser les passings JSON
    return results.map(row => ({
      ...row,
      passings: JSON.parse(row.passings || '[]')
    }));
  }

  /**
   * Trouver par ID
   */
  findById(id) {
    const result = this.db.prepare(`
      SELECT 
        td.*,
        p.name as participantName,
        p.team as participantTeam,
        p.category as participantCategory
      FROM timing_data td
      LEFT JOIN participants p ON td.participantId = p.id
      WHERE td.id = ?
    `).get(id);

    if (result) {
      result.passings = JSON.parse(result.passings || '[]');
    }
    
    return result;
  }

  /**
   * Trouver par participant
   */
  findByParticipant(participantId) {
    const result = this.db.prepare(`
      SELECT * FROM timing_data WHERE participantId = ?
    `).get(participantId);

    if (result) {
      result.passings = JSON.parse(result.passings || '[]');
    }
    
    return result;
  }

  /**
   * Trouver par numéro de dossard
   */
  findByBibNumber(raceId, bibNumber) {
    const result = this.db.prepare(`
      SELECT 
        td.*,
        p.name as participantName,
        p.team as participantTeam,
        p.category as participantCategory
      FROM timing_data td
      LEFT JOIN participants p ON td.participantId = p.id
      WHERE td.raceId = ? AND td.bibNumber = ?
    `).get(raceId, bibNumber);

    if (result) {
      result.passings = JSON.parse(result.passings || '[]');
    }
    
    return result;
  }

  /**
   * Mettre à jour les données de chronométrage
   */
  update(id, updateData) {
    const timing = this.findById(id);
    if (!timing) return null;

    const fields = [];
    const params = [];

    // Champs autorisés à être mis à jour
    const allowedFields = [
      'chipId', 'passings', 'startTime', 'finishTime', 'totalTime',
      'status', 'position', 'category', 'notes'
    ];

    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        if (field === 'passings' && Array.isArray(updateData[field])) {
          fields.push(`${field} = ?`);
          params.push(JSON.stringify(updateData[field]));
        } else {
          fields.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }
    });

    if (fields.length === 0) return timing;

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const query = `UPDATE timing_data SET ${fields.join(', ')} WHERE id = ?`;
    const result = this.db.prepare(query).run(params);

    if (result.changes > 0) {
      return this.findById(id);
    }
    return null;
  }

  /**
   * Ajouter un passage
   */
  addPassing(id, passing) {
    const timing = this.findById(id);
    if (!timing) return null;

    // Parser les passings existants (ils sont stockés en JSON)
    let passings = [];
    try {
      if (timing.passings) {
        if (typeof timing.passings === 'string') {
          passings = JSON.parse(timing.passings);
        } else if (Array.isArray(timing.passings)) {
          passings = timing.passings;
        }
      }
    } catch (e) {
      logger.warn(`Erreur parsing passings existants pour ${id}:`, e);
      passings = [];
    }

    passings.push({
      ...passing,
      id: generateId(),
      timestamp: passing.timestamp || new Date().toISOString()
    });

    return this.update(id, { passings });
  }

  /**
   * Démarrer le chronométrage d'un participant
   */
  startTiming(id, startTime = null) {
    const start = startTime || new Date().toISOString();
    return this.update(id, {
      startTime: start,
      status: TIMING_STATUS.RUNNING
    });
  }

  /**
   * Terminer le chronométrage d'un participant
   */
  finishTiming(id, finishTime = null) {
    const timing = this.findById(id);
    if (!timing) return null;

    let finish = finishTime;
    
    // S'assurer que finishTime est une chaîne ISO ou null
    if (finishTime && typeof finishTime !== 'string') {
      if (finishTime instanceof Date) {
        finish = finishTime.toISOString();
        logger.warn(`finishTiming: Conversion d'un objet Date en chaîne ISO pour id=${id}`);
      } else {
        logger.error(`finishTiming: Type invalide pour finishTime (${typeof finishTime}), utilisation de la date actuelle`);
        finish = new Date().toISOString();
      }
    } else if (!finish) {
      finish = new Date().toISOString();
    }
    
    let totalTime = null;

    if (timing.startTime) {
      const startMs = new Date(timing.startTime).getTime();
      const finishMs = new Date(finish).getTime();
      
      // Vérifier que les dates sont valides
      if (!isNaN(startMs) && !isNaN(finishMs) && finishMs >= startMs) {
        totalTime = finishMs - startMs;
      } else {
        logger.warn(`Dates invalides pour le calcul du temps total: startTime=${timing.startTime}, finishTime=${finish}`);
      }
    }

    return this.update(id, {
      finishTime: finish,
      totalTime,
      status: TIMING_STATUS.FINISHED
    });
  }

  /**
   * Marquer un participant comme DNS (Did Not Start)
   */
  markDNS(id) {
    return this.update(id, { status: TIMING_STATUS.DNS });
  }

  /**
   * Marquer un participant comme DNF (Did Not Finish)
   */
  markDNF(id) {
    return this.update(id, { status: TIMING_STATUS.DNF });
  }

  /**
   * Calculer les positions
   */
  calculatePositions(raceId, category = null) {
    // Récupérer tous les participants actifs (running ou finished) avec au moins un passage
    let query = `
      SELECT id, totalTime, category, status, passings
      FROM timing_data 
      WHERE raceId = ? AND (status = ? OR status = ?) AND passings IS NOT NULL AND passings != ''
    `;
    const params = [raceId, TIMING_STATUS.RUNNING, TIMING_STATUS.FINISHED];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    const participants = this.db.prepare(query).all(params);

    // Calculer les statistiques pour chaque participant
    const participantStats = participants.map(p => {
      let passings = [];
      try {
        // Parsing sécurisé des passings
        if (Array.isArray(p.passings)) {
          passings = p.passings;
        } else if (typeof p.passings === 'string') {
          const passingsStr = p.passings.trim();
          passings = passingsStr === '' ? [] : JSON.parse(passingsStr);
        } else if (p.passings && typeof p.passings === 'object') {
          passings = [p.passings]; // Un seul objet, le mettre dans un array
        } else {
          passings = [];
        }
      } catch (error) {
        console.warn(`Erreur parsing passings pour participant ${p.id}:`, error.message, 'Data:', p.passings);
        passings = [];
      }

      const lapCount = passings.length;
      const lastPassing = passings.length > 0 ? passings[passings.length - 1] : null;
      const elapsedTime = lastPassing ? lastPassing.elapsedTime : 0;
      const isFinished = p.status === TIMING_STATUS.FINISHED;

      return {
        id: p.id,
        lapCount,
        elapsedTime,
        isFinished,
        totalTime: p.totalTime
      };
    });

    // Trier par nombre de tours (décroissant), puis par temps écoulé (croissant)
    participantStats.sort((a, b) => {
      // Les terminés d'abord
      if (a.isFinished && !b.isFinished) return -1;
      if (!a.isFinished && b.isFinished) return 1;
      
      // Puis par nombre de tours (plus de tours = meilleure position)
      if (a.lapCount !== b.lapCount) {
        return b.lapCount - a.lapCount;
      }
      
      // Puis par temps écoulé (moins de temps = meilleure position)
      return a.elapsedTime - b.elapsedTime;
    });

    // Mettre à jour les positions
    const updateStmt = this.db.prepare(`
      UPDATE timing_data SET position = ?, updatedAt = ? WHERE id = ?
    `);

    const transaction = this.db.transaction(() => {
      participantStats.forEach((participant, index) => {
        updateStmt.run(
          index + 1,
          new Date().toISOString(),
          participant.id
        );
      });
    });

    transaction();
    
    return participantStats.length;
  }

  /**
   * Obtenir le classement d'une course
   */
  getRanking(raceId, category = null) {
    let query = `
      SELECT 
        td.*,
        p.name as participantName,
        p.team as participantTeam,
        p.number as participantNumber
      FROM timing_data td
      LEFT JOIN participants p ON td.participantId = p.id
      WHERE td.raceId = ? AND td.status = ?
    `;
    const params = [raceId, TIMING_STATUS.FINISHED];

    if (category) {
      query += ` AND (td.category = ? OR p.category = ?)`;
      params.push(category, category);
    }

    query += ` ORDER BY td.position ASC`;

    const results = this.db.prepare(query).all(params);
    
    return results.map(row => ({
      ...row,
      passings: JSON.parse(row.passings || '[]')
    }));
  }

  /**
   * Obtenir les statistiques de la course
   */
  getRaceStats(raceId) {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running,
        COUNT(CASE WHEN status = 'dns' THEN 1 END) as dns,
        COUNT(CASE WHEN status = 'dnf' THEN 1 END) as dnf,
        COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered,
        MIN(totalTime) as bestTime,
        AVG(totalTime) as averageTime
      FROM timing_data 
      WHERE raceId = ?
    `).get(raceId);

    const categoryStats = this.db.prepare(`
      SELECT 
        COALESCE(td.category, p.category, 'Général') as category,
        COUNT(*) as count,
        COUNT(CASE WHEN td.status = 'finished' THEN 1 END) as finished
      FROM timing_data td
      LEFT JOIN participants p ON td.participantId = p.id
      WHERE td.raceId = ?
      GROUP BY COALESCE(td.category, p.category, 'Général')
    `).all(raceId);

    return {
      ...stats,
      categories: categoryStats
    };
  }

  /**
   * Supprimer les données de chronométrage
   */
  delete(id) {
    const result = this.db.prepare(`DELETE FROM timing_data WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  /**
   * Supprimer toutes les données d'une course
   */
  deleteByRace(raceId) {
    const result = this.db.prepare(`DELETE FROM timing_data WHERE raceId = ?`).run(raceId);
    return result.changes;
  }

  /**
   * Initialiser les données de chronométrage pour tous les participants d'une course
   */
  initializeRaceTimings(raceId) {
    // Récupérer tous les participants actifs de la course
    const activeParticipants = this.db.prepare(`
      SELECT p.* 
      FROM participants p
      WHERE p.raceId = ? AND p.isActive = 1
    `).all(raceId);

    if (activeParticipants.length === 0) {
      return [];
    }

    // Vérifier quels participants n'ont pas encore de données de timing
    const existingTimings = this.db.prepare(`
      SELECT participantId 
      FROM timing_data 
      WHERE raceId = ?
    `).all(raceId);
    
    const existingParticipantIds = new Set(existingTimings.map(t => t.participantId));
    const participantsToInitialize = activeParticipants.filter(p => !existingParticipantIds.has(p.id));

    if (participantsToInitialize.length === 0) {
      return this.findByRace(raceId);
    }

    const stmt = this.db.prepare(`
      INSERT INTO timing_data (
        id, participantId, raceId, bibNumber, status, category, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const results = [];
    const transaction = this.db.transaction(() => {
      for (const participant of participantsToInitialize) {
        const timing = {
          id: generateId(),
          participantId: participant.id,
          raceId: raceId,
          bibNumber: participant.number,
          status: TIMING_STATUS.REGISTERED,
          category: participant.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const result = stmt.run(
          timing.id, timing.participantId, timing.raceId,
          timing.bibNumber, timing.status, timing.category,
          timing.createdAt, timing.updatedAt
        );

        if (result.changes > 0) {
          results.push(this.findById(timing.id));
        }
      }
    });

    transaction();
    return results;
  }
}

module.exports = TimingData;
