const BaseController = require('../BaseController');

class LearningController extends BaseController {
  constructor(learningService) {
    super();
    this.learningService = learningService;

    this.getState = this.getState.bind(this);
    this.saveState = this.saveState.bind(this);
  }

  getState(req, res) {
    return this.execute(res, () => this.learningService.getState(req.user, req.params.videoId));
  }

  saveState(req, res) {
    return this.execute(res, () =>
      this.learningService.saveState(req.user, req.params.videoId, req.body)
    );
  }
}

module.exports = LearningController;
