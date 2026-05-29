const MAX_NOTES_LENGTH = 8000;
const MAX_TODO_LENGTH = 1000;

class LearningService {
  constructor({ learningStateRepository }) {
    this.learningStateRepository = learningStateRepository;
  }

  async getState(user, videoId) {
    const row = await this.learningStateRepository.findByUserAndVideo(user.id, String(videoId));
    if (!row) {
      return { notes: '', checklist: [] };
    }
    return { notes: row.notes, checklist: row.checklist };
  }

  async saveState(user, videoId, payload) {
    const normalized = this.normalize(payload);
    await this.learningStateRepository.upsert({
      userId: user.id,
      videoId: String(videoId),
      notes: normalized.notes,
      checklist: normalized.checklist
    });
    return { ok: true };
  }

  normalize(payload = {}) {
    const notes = String(payload.notes || '').slice(0, MAX_NOTES_LENGTH);
    const checklist = Array.isArray(payload.checklist)
      ? payload.checklist.map((item) => ({
          id: String(item?.id || ''),
          text: String(item?.text || '').slice(0, MAX_TODO_LENGTH),
          done: !!item?.done
        }))
      : [];

    return { notes, checklist };
  }
}

module.exports = LearningService;
