const { formatTime, parseTimeString, generateId } = require('../utils/helpers');
const { RACE_TYPES, RACE_STATUS, DURATION_TYPES } = require('../utils/constants');

class Race {
  constructor(db) {
    this.db = db;
    this.tableName = 'races';
  }

  /**
   * Créer une nouvelle course
   */
  create(raceData) {
    const race = {
      id: generateId(),
      name: raceData.name,
      date: raceData.date,
      time: raceData.time || null,
      location: raceData.location || null,
      type: raceData.type,
      duration: raceData.duration || null,
      durationType: raceData.durationType || DURATION_TYPES.TIME,
      maxParticipants: raceData.maxParticipants || null,
      description: raceData.description || null,
      status: RACE_STATUS.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const stmt = this.db.prepare(`
      INSERT INTO races (
        id, name, date, time, location, type, duration, durationType,
        maxParticipants, description, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      race.id, race.name, race.date, race.time, race.location,
      race.type, race.duration, race.durationType, race.maxParticipants,
      race.description, race.status, race.createdAt, race.updatedAt
    );

    if (result.changes > 0) {
      return this.findById(race.id);
    }
    return null;
  }

  /**
   * Trouver toutes les courses
   */
  findAll(options = {}) {
    let query = `SELECT * FROM races`;
    const params = [];

    // Filtres
    const conditions = [];
    if (options.status) {
      if (Array.isArray(options.status)) {
        // Si c'est un tableau, utiliser IN clause
        const placeholders = options.status.map(() => '?').join(',');
        conditions.push(`status IN (${placeholders})`);
        params.push(...options.status);
      } else {
        // Si c'est une chaîne simple
        conditions.push('status = ?');
        params.push(options.status);
      }
    }
    if (options.type) {
      conditions.push('type = ?');
      params.push(options.type);
    }
    if (options.dateFrom) {
      conditions.push('date >= ?');
      params.push(options.dateFrom);
    }
    if (options.dateTo) {
      conditions.push('date <= ?');
      params.push(options.dateTo);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Tri
    query += ` ORDER BY ${options.orderBy || 'date'} ${options.order || 'DESC'}`;

    // Limite
    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    return this.db.prepare(query).all(params);
  }

  /**
   * Trouver une course par ID
   */
  findById(id) {
    return this.db.prepare(`SELECT * FROM races WHERE id = ?`).get(id);
  }

  /**
   * Mettre à jour une course
   */
  update(id, updateData) {
    const race = this.findById(id);
    if (!race) return null;

    const fields = [];
    const params = [];

    // Champs autorisés à être mis à jour
    const allowedFields = [
      'name', 'date', 'time', 'location', 'type', 'duration',
      'durationType', 'maxParticipants', 'description', 'status'
    ];

    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        fields.push(`${field} = ?`);
        params.push(updateData[field]);
      }
    });

    if (fields.length === 0) return race;

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const query = `UPDATE races SET ${fields.join(', ')} WHERE id = ?`;
    const result = this.db.prepare(query).run(params);

    if (result.changes > 0) {
      return this.findById(id);
    }
    return null;
  }

  /**
   * Supprimer une course
   */
  delete(id) {
    const result = this.db.prepare(`DELETE FROM races WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  /**
   * Obtenir le nombre de participants d'une course
   */
  getParticipantCount(raceId) {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM participants WHERE raceId = ?
    `).get(raceId);
    return result.count;
  }

  /**
   * Vérifier si une course peut être supprimée
   */
  canDelete(raceId) {
    const participantCount = this.getParticipantCount(raceId);
    const race = this.findById(raceId);
    
    // Ne peut pas supprimer si la course est en cours ou terminée et a des participants
    return !(participantCount > 0 && (
      race.status === RACE_STATUS.IN_PROGRESS || 
      race.status === RACE_STATUS.COMPLETED
    ));
  }

  /**
   * Changer le statut d'une course
   */
  updateStatus(raceId, newStatus) {
    const race = this.findById(raceId);
    if (!race) return null;

    // Vérifier les transitions de statut autorisées
    const allowedTransitions = {
      [RACE_STATUS.DRAFT]: [RACE_STATUS.READY, RACE_STATUS.CANCELLED],
      [RACE_STATUS.READY]: [RACE_STATUS.ACTIVE, RACE_STATUS.IN_PROGRESS, RACE_STATUS.CANCELLED, RACE_STATUS.DRAFT],
      [RACE_STATUS.IN_PROGRESS]: [RACE_STATUS.FINISHING, RACE_STATUS.FINISHED, RACE_STATUS.PAUSED, RACE_STATUS.CANCELLED],
      [RACE_STATUS.ACTIVE]: [RACE_STATUS.FINISHING, RACE_STATUS.FINISHED, RACE_STATUS.PAUSED, RACE_STATUS.CANCELLED],
      [RACE_STATUS.FINISHING]: [RACE_STATUS.FINISHED, RACE_STATUS.CANCELLED], // En cours de finition peut seulement aller vers terminé ou annulé
      [RACE_STATUS.PAUSED]: [RACE_STATUS.ACTIVE, RACE_STATUS.IN_PROGRESS, RACE_STATUS.FINISHED, RACE_STATUS.CANCELLED, RACE_STATUS.DRAFT],
      [RACE_STATUS.FINISHED]: [RACE_STATUS.CANCELLED, RACE_STATUS.READY], // Une course terminée peut être annulée ou remise à zéro
      [RACE_STATUS.COMPLETED]: [RACE_STATUS.CANCELLED, RACE_STATUS.READY], // Une course complétée peut être annulée ou remise à zéro
      [RACE_STATUS.CANCELLED]: [RACE_STATUS.DRAFT]
    };

    if (!allowedTransitions[race.status].includes(newStatus)) {
      throw new Error(`Transition de statut non autorisée : ${race.status} -> ${newStatus}`);
    }

    return this.update(raceId, { status: newStatus });
  }

  /**
   * Obtenir les statistiques d'une course
   */
  getStats(raceId) {
    const race = this.findById(raceId);
    if (!race) return null;

    const participantCount = this.getParticipantCount(raceId);
    
    const timingStats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalTimings,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finishedCount,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as runningCount,
        COUNT(CASE WHEN status = 'dns' THEN 1 END) as dnsCount,
        COUNT(CASE WHEN status = 'dnf' THEN 1 END) as dnfCount
      FROM timing_data 
      WHERE raceId = ?
    `).get(raceId);

    return {
      race,
      participants: participantCount,
      ...timingStats
    };
  }
}

module.exports = Race;
