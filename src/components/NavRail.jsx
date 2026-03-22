import { useSection } from '../context/SectionContext';
import '../styles/NavRail.css';

const navItems = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'skills', label: 'Skills', icon: '◆' },
  { id: 'projects', label: 'Projects', icon: '▧' },
  { id: 'contact', label: 'Contact', icon: '✉' },
];

export default function NavRail() {
  const { activeNavSection, goToSection } = useSection();

  return (
    <nav className="nav-rail">
      {navItems.map(item => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`nav-rail__item ${activeNavSection === item.id ? 'nav-rail__item--active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            goToSection(item.id);
          }}
        >
          <span className="nav-rail__icon">{item.icon}</span>
          <span className="nav-rail__label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
