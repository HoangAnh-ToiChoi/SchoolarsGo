import { Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button
      onClick={toggleTheme}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${className}`}
      title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
      aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark'
        ? <Sun className="w-[18px] h-[18px]" />
        : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
};

export default ThemeToggle;
