/* eslint-disable no-console */
require('dotenv').config();

const { sequelize, QuizQuestion } = require('../src/models');
const { QUIZ_QUESTIONS_SEED } = require('./quizQuestionsSeed');

async function run() {
  await sequelize.authenticate();
  await sequelize.sync();

  const existing = await QuizQuestion.count({ where: { origen: 'seed' } });
  if (existing > 0) {
    console.log(`[seed-quiz] limpiando ${existing} preguntas seed previas...`);
    await QuizQuestion.destroy({ where: { origen: 'seed' } });
  }

  const inserted = await QuizQuestion.bulkCreate(QUIZ_QUESTIONS_SEED);
  console.log(`[seed-quiz] insertadas ${inserted.length} preguntas`);

  const byVideo = {};
  for (const q of QUIZ_QUESTIONS_SEED) {
    byVideo[q.videoId] = (byVideo[q.videoId] || 0) + 1;
  }
  console.log('[seed-quiz] distribucion por video:');
  Object.entries(byVideo).forEach(([videoId, count]) => {
    console.log(`  ${videoId}: ${count} preguntas`);
  });

  await sequelize.close();
}

run().catch((err) => {
  console.error('[seed-quiz] error:', err);
  process.exit(1);
});
