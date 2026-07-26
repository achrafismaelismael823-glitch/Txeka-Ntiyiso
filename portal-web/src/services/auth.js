const TOKEN_KEY = 'txeka_token';
const USER_KEY = 'txeka_user';

export const authService = {
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  isAuthenticated: () => !!authService.getToken(),
  isAdmin: () => authService.getUser()?.role === 'admin',
  isInstitution: () => authService.getUser()?.role === 'institution',
  getInstitutionId: () => authService.getUser()?.id || null,
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
