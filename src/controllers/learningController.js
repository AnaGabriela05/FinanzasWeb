// /src/controllers/learningController.js
const { LearningState } = require('../models');

function normalizePayload(body) {
  const notes = String(body?.notes || '').slice(0, 8000); // corta por si acaso
  const checklist = Array.isArray(body?.checklist) ? body.checklist.map((it) => ({
    id: String(it.id || ''),
    text: String(it.text || '').slice(0, 1000),
    done: !!it.done
  })) : [];
  return { notes, checklist };
}

exports.getState = async (req, res, next) => {
  try {
    const userId = req.user.id;        // ← del middleware
    const videoId = String(req.params.videoId);
    const row = await LearningState.findOne({ where: { userId, videoId } });
    res.json(row ? { notes: row.notes, checklist: row.checklist } : { notes: '', checklist: [] });
  } catch (e) { next(e); }
};

exports.saveState = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const videoId = String(req.params.videoId);
    const { notes = '', checklist = [] } = req.body || {};

    await LearningState.upsert({ userId, videoId, notes, checklist });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.putState = async (req, res) => {
  const userId = req.user.id;
  const { videoId } = req.params;
  const payload = normalizePayload(req.body || {});

  const [row, created] = await LearningState.findOrCreate({
    where: { userId, videoId },
    defaults: { data: { notes: '', checklist: [] } }
  });
  row.data = payload;
  await row.save();

  return res.json({ ok: true, created });
};
