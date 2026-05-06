class BaseController {
  async execute(res, action, successStatus = 200) {
    try {
      const payload = await action();
      const status = payload?.status || successStatus;
      const body = payload?.body !== undefined ? payload.body : payload;
      return res.status(status).json(body);
    } catch (error) {
      const status = error.status || 500;
      const body = { error: error.message || 'Error interno' };

      if (error.details && !Array.isArray(error.details) && typeof error.details === 'object') {
        Object.assign(body, error.details);
      } else if (error.details) {
        body.details = error.details;
      }

      return res.status(status).json(body);
    }
  }
}

module.exports = BaseController;
