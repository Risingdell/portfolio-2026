import { useSection } from '../context/SectionContext';
import '../styles/ScrollArrow.css';

export default function ScrollArrow() {
  const { displayStage, goNext } = useSection();

  // Only show on the hero (home) stage
  if (displayStage !== 'hero') return null;

  return (
    <button className="scroll-arrow" onClick={goNext} aria-label="Scroll to next section">
      <span className="scroll-arrow__text">Scroll</span>
      <span className="scroll-arrow__icon">▾</span>
    </button>
  );
}
