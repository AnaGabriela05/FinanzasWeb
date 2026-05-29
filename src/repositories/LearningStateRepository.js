const { LearningState } = require('../models');

class LearningStateRepository {
  findByUserAndVideo(userId, videoId) {
    return LearningState.findOne({ where: { userId, videoId } });
  }

  upsert({ userId, videoId, notes, checklist }) {
    return LearningState.upsert({ userId, videoId, notes, checklist });
  }
}

module.exports = LearningStateRepository;
