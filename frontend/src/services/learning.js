import { API } from '../lib/api'

export const LearningService = {
  getState(videoId) {
    return API.get(`/api/learning/${encodeURIComponent(videoId)}/state`)
  },

  saveState(videoId, payload) {
    return API.put(`/api/learning/${encodeURIComponent(videoId)}/state`, payload)
  }
}
