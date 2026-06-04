import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

const ThemeApplier = () => {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
};

export default ThemeApplier;
