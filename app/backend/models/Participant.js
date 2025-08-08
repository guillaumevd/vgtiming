const { generateId } = require('../utils/helpers');
const logger = require('../utils/logger');

class Participant {
  constructor(db) {
    this.db = db;
    this.tableName = 'participants';
  }

  /**
   * Convertir les résultats de SQLite en format correct
   */
  _formatParticipant(participant) {
    if (!participant) return null;
    return {
      ...participant,
      isActive: Boolean(participant.isActive) // Convertir 0/1 en false/true
    };
  }

  /**
   * Convertir un tableau de participants
   */
  _formatParticipants(participants) {
    return participants.map(p => this._formatParticipant(p));
  }

  /**
   * Créer un nouveau participant
   */
  create(participantData) {
    // Vérifier que le numéro n'existe pas déjà pour cette course
    const existingParticipant = this.findByRaceAndNumber(
      participantData.raceId, 
      participantData.number
    );
    
    if (existingParticipant) {
      throw new Error(`Le numéro ${participantData.number} est déjà utilisé dans cette course`);
    }

    const participant = {
      id: generateId(),
      raceId: participantData.raceId,
      number: String(participantData.number), // Assurer que c'est une chaîne
      name: participantData.name,
      epcTag: (participantData.epcTag && participantData.epcTag.trim()) || null,
      category: participantData.category || 'Général',
      team: (participantData.team && participantData.team.trim()) || null,
      isActive: participantData.isActive !== undefined ? participantData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const stmt = this.db.prepare(`
      INSERT INTO participants (
        id, raceId, number, name, epcTag, category, team, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      participant.id, participant.raceId, participant.number, participant.name,
      participant.epcTag, participant.category, participant.team, 
      participant.isActive ? 1 : 0, // Convertir booléen en entier pour SQLite
      participant.createdAt, participant.updatedAt
    );

    if (result.changes > 0) {
      return this._formatParticipant(this.findById(participant.id));
    }
    return null;
  }

  /**
   * Créer plusieurs participants en lot
   */
  createBatch(participants) {
    const stmt = this.db.prepare(`
      INSERT INTO participants (
        id, raceId, number, name, epcTag, category, team, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const results = [];
    const transaction = this.db.transaction(() => {
      for (const participantData of participants) {
        // Vérifier l'unicité du numéro
        const existingParticipant = this.findByRaceAndNumber(
          participantData.raceId, 
          participantData.number
        );
        
        if (existingParticipant) {
          throw new Error(`Le numéro ${participantData.number} est déjà utilisé dans cette course`);
        }

        const participant = {
          id: generateId(),
          raceId: participantData.raceId,
          number: String(participantData.number), // Assurer que c'est une chaîne
          name: participantData.name,
          epcTag: participantData.epcTag || null,
          category: participantData.category || 'Général',
          team: participantData.team || null,
          isActive: participantData.isActive !== undefined ? participantData.isActive : true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const result = stmt.run(
          participant.id, participant.raceId, participant.number, participant.name,
          participant.epcTag, participant.category, participant.team, 
          participant.isActive ? 1 : 0, // Convertir booléen en entier pour SQLite
          participant.createdAt, participant.updatedAt
        );

        if (result.changes > 0) {
          results.push(this._formatParticipant(this.findById(participant.id)));
        }
      }
    });

    transaction();
    return results;
  }

  /**
   * Trouver tous les participants d'une course
   */
  findByRace(raceId, options = {}) {
    let query = `SELECT * FROM participants WHERE raceId = ?`;
    const params = [raceId];

    // Filtres
    const conditions = [];
    if (options.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }
    if (options.team) {
      conditions.push('team = ?');
      params.push(options.team);
    }
    if (options.search) {
      conditions.push('(name LIKE ? OR team LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    // Tri
    query += ` ORDER BY ${options.orderBy || 'number'} ${options.order || 'ASC'}`;

    const results = this.db.prepare(query).all(params);
    return this._formatParticipants(results);
  }

  /**
   * Trouver un participant par ID
   */
  findById(id) {
    const result = this.db.prepare(`SELECT * FROM participants WHERE id = ?`).get(id);
    return this._formatParticipant(result);
  }

  /**
   * Trouver un participant par course et numéro
   */
  findByRaceAndNumber(raceId, number) {
    const result = this.db.prepare(`
      SELECT * FROM participants WHERE raceId = ? AND number = ?
    `).get(raceId, number);
    return this._formatParticipant(result);
  }

  /**
   * Mettre à jour un participant
   */
  update(id, updateData) {
    const participant = this.findById(id);
    if (!participant) return null;

    logger.debug(`Mise à jour participant ${id}: number actuel="${participant.number}", nouveau="${updateData.number}"`);

    // Si on change le numéro, vérifier l'unicité
    if (updateData.number && String(updateData.number) !== String(participant.number)) {
      const existingParticipant = this.findByRaceAndNumber(
        participant.raceId, 
        updateData.number
      );
      if (existingParticipant && existingParticipant.id !== id) {
        throw new Error(`Le numéro ${updateData.number} est déjà utilisé dans cette course`);
      }
    }

    const fields = [];
    const params = [];

    // Champs autorisés à être mis à jour (correspondant au frontend)
    const allowedFields = ['number', 'name', 'epcTag', 'category', 'team', 'isActive'];

    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        let value = updateData[field];
        
        // Traiter les strings vides pour epcTag et team
        if ((field === 'epcTag' || field === 'team') && value === '') {
          value = null;
        }
        
        // Convertir boolean pour SQLite
        if (field === 'isActive' && typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        
        fields.push(`${field} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) return participant;

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const query = `UPDATE participants SET ${fields.join(', ')} WHERE id = ?`;
    const result = this.db.prepare(query).run(params);

    if (result.changes > 0) {
      return this._formatParticipant(this.findById(id));
    }
    return null;
  }

  /**
   * Supprimer un participant
   */
  delete(id) {
    const result = this.db.prepare(`DELETE FROM participants WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  /**
   * Supprimer tous les participants d'une course
   */
  deleteByRace(raceId) {
    const result = this.db.prepare(`DELETE FROM participants WHERE raceId = ?`).run(raceId);
    return result.changes;
  }

  /**
   * Obtenir le prochain numéro disponible pour une course
   */
  getNextAvailableNumber(raceId) {
    const maxNumber = this.db.prepare(`
      SELECT MAX(number) as maxNumber FROM participants WHERE raceId = ?
    `).get(raceId);

    return (maxNumber.maxNumber || 0) + 1;
  }

  /**
   * Obtenir les statistiques des participants par course
   */
  getStatsByRace(raceId) {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT category) as categoriesCount,
        COUNT(DISTINCT team) as teamsCount
      FROM participants 
      WHERE raceId = ?
    `).get(raceId);

    const categoriesStats = this.db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM participants 
      WHERE raceId = ? 
      GROUP BY category
      ORDER BY count DESC
    `).all(raceId);

    const teamsStats = this.db.prepare(`
      SELECT team, COUNT(*) as count 
      FROM participants 
      WHERE raceId = ? AND team IS NOT NULL
      GROUP BY team
      ORDER BY count DESC
    `).all(raceId);

    return {
      ...stats,
      categories: categoriesStats,
      teams: teamsStats
    };
  }

  /**
   * Rechercher des participants
   */
  search(searchTerm, raceId = null) {
    let query = `
      SELECT p.*, r.name as raceName 
      FROM participants p
      LEFT JOIN races r ON p.raceId = r.id
      WHERE (p.name LIKE ? OR p.team LIKE ? OR p.email LIKE ?)
    `;
    const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    if (raceId) {
      query += ` AND p.raceId = ?`;
      params.push(raceId);
    }

    query += ` ORDER BY p.name ASC LIMIT 50`;

    return this.db.prepare(query).all(params);
  }

  /**
   * Dupliquer les participants d'une course vers une autre
   */
  duplicateToRace(sourceRaceId, targetRaceId) {
    const sourceParticipants = this.findByRace(sourceRaceId);
    const duplicatedParticipants = [];

    for (const participant of sourceParticipants) {
      const newParticipant = {
        raceId: targetRaceId,
        number: participant.number,
        name: participant.name,
        email: participant.email,
        team: participant.team,
        category: participant.category,
        birthYear: participant.birthYear,
        notes: participant.notes
      };

      try {
        const created = this.create(newParticipant);
        if (created) {
          duplicatedParticipants.push(created);
        }
      } catch (error) {
        // Si le numéro existe déjà, essayer avec le prochain numéro disponible
        if (error.message.includes('déjà utilisé')) {
          newParticipant.number = this.getNextAvailableNumber(targetRaceId);
          const created = this.create(newParticipant);
          if (created) {
            duplicatedParticipants.push(created);
          }
        }
      }
    }

    return duplicatedParticipants;
  }
}

module.exports = Participant;
