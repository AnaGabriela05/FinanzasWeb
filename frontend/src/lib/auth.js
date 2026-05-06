export const Auth = {
  saveToken(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user || {}))
  },
  token() {
    return localStorage.getItem('token')
  },
  user() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  },
  isLoggedIn() {
    return !!this.token()
  },
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}