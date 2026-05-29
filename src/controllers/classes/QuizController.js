const BaseController = require('../BaseController');

class QuizController extends BaseController {
  constructor(quizService) {
    super();
    this.quizService = quizService;

    this.start = this.start.bind(this);
    this.submit = this.submit.bind(this);
    this.getProgress = this.getProgress.bind(this);
    this.getVideosStatus = this.getVideosStatus.bind(this);
    this.getHistory = this.getHistory.bind(this);
  }

  start(req, res) {
    return this.execute(res, () => this.quizService.startQuiz(req.user.id, req.body?.videoId));
  }

  submit(req, res) {
    return this.execute(res, () => this.quizService.submitQuiz(req.user.id, req.body), 201);
  }

  getProgress(req, res) {
    return this.execute(res, () => this.quizService.getUserProgress(req.user.id));
  }

  getVideosStatus(req, res) {
    return this.execute(res, () => this.quizService.getVideosWithQuizStatus(req.user.id));
  }

  getHistory(req, res) {
    return this.execute(res, () => this.quizService.getQuizHistory(req.user.id, {
      limit: req.query.limit,
      offset: req.query.offset
    }));
  }
}

module.exports = QuizController;
