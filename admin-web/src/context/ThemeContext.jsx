import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const THEME_STORAGE_KEY = 'comanda_admin_theme';
const LIGHT_ONLY_ROUTES = ['/inicio', '/admin', '/login', '/cambiar-password', '/descubre', '/planes/gracias'];

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {}
});

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return 'light';
}

function isLightOnlyRoute(pathname = '') {
  return LIGHT_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function ThemeProvider({ children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(getInitialTheme);
  const effectiveTheme = isLightOnlyRoute(location.pathname) ? 'light' : theme;

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (event.newValue !== 'light' && event.newValue !== 'dark') return;
      setTheme(event.newValue);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme,
      isDark: effectiveTheme === 'dark',
      setTheme,
      toggleTheme: () => setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
    }),
    [effectiveTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
