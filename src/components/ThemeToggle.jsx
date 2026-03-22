import { useTheme } from '../context/ThemeContext';
import '../styles/ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      <span className="theme-toggle__icon">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
      <span className="theme-toggle__label">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
