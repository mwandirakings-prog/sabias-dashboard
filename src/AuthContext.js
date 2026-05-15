import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('sabias_token');
    const savedUser = localStorage.getItem('sabias_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('sabias_token', userToken);
    localStorage.setItem('sabias_user', JSON.stringify(userData));
  };

  const logout = () => {
  setUser(null);
  setToken(null);
  localStorage.removeItem('sabias_token');
  localStorage.removeItem('sabias_user');
  window.location.href = '/';
};

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);