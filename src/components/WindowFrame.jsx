import { useState, useEffect, useCallback } from 'react';
import ThemeToggle from './ThemeToggle';
import signatureMark from '../assets/signature-mark.png';
import '../styles/WindowFrame.css';

export default function WindowFrame({ children }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pulse, setPulse] = useState(null);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleMaximize = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen can be denied (e.g. iframe without allowfullscreen) — no-op, button just stays inactive.
      });
    }
  }, []);

  // Minimize/close have no real target on a webpage — a brief press animation
  // acknowledges the click without pretending to do something it can't.
  const handleDecorativeClick = useCallback((id) => {
    setPulse(id);
    setTimeout(() => setPulse(null), 300);
  }, []);

  return (
    <div className="window-frame">
      <div className="window-frame__titlebar">
        <div className="window-frame__brand">
          <img className="window-frame__brand-mark" src={signatureMark} alt="Dhanush M" />
          <span className="window-frame__brand-label">Dhanush M</span>
        </div>
        <div className="window-frame__controls">
          <ThemeToggle />
          <div className="window-frame__dots" role="group" aria-label="Window controls">
            <button
              type="button"
              className={`window-frame__dot window-frame__dot--minimize ${pulse === 'minimize' ? 'window-frame__dot--pulse' : ''}`}
              onClick={() => handleDecorativeClick('minimize')}
              aria-label="Minimize (decorative)"
            >
              &minus;
            </button>
            <button
              type="button"
              className="window-frame__dot window-frame__dot--maximize"
              onClick={handleMaximize}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? '❐' : '□'}
            </button>
            <button
              type="button"
              className={`window-frame__dot window-frame__dot--close ${pulse === 'close' ? 'window-frame__dot--pulse' : ''}`}
              onClick={() => handleDecorativeClick('close')}
              aria-label="Close (decorative)"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
      <div className="window-frame__body">
        {children}
      </div>
    </div>
  );
}
