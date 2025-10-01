const { LearningTopic, LearningLesson, QuizQuestion, UserLessonProgress } = require('../models');

function hideAnswers(qs){ return qs.map(q => ({ id:q.id, enunciado:q.enunciado, opciones:q.opciones })); }

exports.getTopics = async (req, res) => {
  const topics = await LearningTopic.findAll({
    order: [['orden','ASC']],
    include: [{ model: LearningLesson, as:'lessons', attributes:['id','titulo','orden','duracionMin','topicId'] }]
  });

  const progress = await UserLessonProgress.findAll({ where:{ userId:req.userId } });
  const doneSet = new Set(progress.filter(p => p.completado).map(p => p.lessonId));

  res.json(topics.map(t => {
    const lessons = (t.lessons || []).sort((a,b)=>a.orden-b.orden);
    const total = lessons.length;
    const hechos = lessons.filter(l => doneSet.has(l.id)).length;
    return { id:t.id, titulo:t.titulo, descripcion:t.descripcion, orden:t.orden,
             totalLecciones: total, completadas: hechos, lessons };
  }));
};

exports.getLessons = async (req, res) => {
  const where = {};
  if (req.query.topicId) where.topicId = req.query.topicId;
  const lessons = await LearningLesson.findAll({ where, order:[['orden','ASC']] });
  const progress = await UserLessonProgress.findAll({ where:{ userId:req.userId } });
  const doneSet = new Set(progress.filter(p => p.completado).map(p => p.lessonId));
  res.json(lessons.map(l => ({ ...l.toJSON(), done: doneSet.has(l.id) })));
};

exports.getLesson = async (req, res) => {
  const id = req.params.id;
  const lesson = await LearningLesson.findByPk(id, { include:[{ model: LearningTopic, as:'topic' }] });
  if(!lesson) return res.status(404).json({ error:'Lección no encontrada' });
  const prog = await UserLessonProgress.findOne({ where:{ userId:req.userId, lessonId:id } });
  res.json({ ...lesson.toJSON(), progreso: prog || null });
};

exports.getQuiz = async (req, res) => {
  const id = req.params.id;
  const qs = await QuizQuestion.findAll({ where:{ lessonId:id }, order:[['id','ASC']] });
  res.json(hideAnswers(qs));
};

exports.submitQuiz = async (req, res) => {
  const lessonId = req.params.id;
  const { answers } = req.body;

  const qs = await QuizQuestion.findAll({ where:{ lessonId }, order:[['id','ASC']] });
  if(qs.length === 0) return res.status(400).json({ error:'La lección no tiene preguntas' });

  let correctas = 0;
  qs.forEach((q, i) => { if (Number(answers?.[i]) === Number(q.correcta)) correctas++; });
  const puntaje = Math.round((correctas / qs.length) * 100);
  const aprobado = puntaje >= 70;

  const [prog, created] = await UserLessonProgress.findOrCreate({
    where:{ userId:req.userId, lessonId },
    defaults:{ completado: aprobado, puntaje, intentos:1 }
  });
  if(!created){
    prog.intentos += 1;
    prog.puntaje = Math.max(prog.puntaje, puntaje);
    if(aprobado) prog.completado = true;
    await prog.save();
  }

  res.json({ message:'Quiz evaluado', puntaje, total:qs.length, correctas, aprobado });
};

exports.markComplete = async (req, res) => {
  const lessonId = req.params.id;
  const [prog] = await UserLessonProgress.findOrCreate({
    where:{ userId:req.userId, lessonId }, defaults:{ completado:true, puntaje:100, intentos:1 }
  });
  prog.completado = true; if(prog.puntaje < 100) prog.puntaje = 100;
  await prog.save();
  res.json({ message:'Lección marcada como completada' });
};

exports.myProgress = async (req, res) => {
  const arr = await UserLessonProgress.findAll({ where:{ userId:req.userId } });
  res.json(arr);
};
