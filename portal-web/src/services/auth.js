import Cookies from 'js-cookie';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_data';

export const authService = {
  setToken: (token) => Cookies.set(TOKEN_KEY, token, { expires: 7, secure: true, sameSite: 'strict' }),
  getToken: () => Cookies.get(TOKEN_KEY),
  removeToken: () => Cookies.remove(TOKEN_KEY),
  
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  removeUser: () => localStorage.removeItem(USER_KEY),
  
  isAuthenticated: () => !!Cookies.get(TOKEN_KEY),
  
  logout: () => {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

