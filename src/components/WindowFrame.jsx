import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import signatureMark from '../assets/signature-mark.png';
import '../styles/WindowFrame.css';

const NotFoundPage = lazy(() => import('./NotFoundPage'));

export default function WindowFrame({ children }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

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
  const handleMinimize = useCallback(() => {
    setIsMinimized(current => !current);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosed(true);
  }, []);

  if (isClosed) {
    return (
      <Suspense fallback={<div className="window-frame" />}>
        <NotFoundPage />
      </Suspense>
    );
  }

  return (
    <div className={`window-frame ${isMinimized ? 'window-frame--minimized' : ''}`}>
      <div className="window-frame__titlebar">
        <div className="window-frame__brand">
          <img className="window-frame__brand-mark" src={signatureMark} alt="Dhanush M" />
          <span className="window-frame__brand-label">Dhanush M</span>
        </div>
        <div className="window-frame__controls">
          <div className="window-frame__dots" role="group" aria-label="Window controls">
            <button
              type="button"
              className="window-frame__dot window-frame__dot--minimize"
              onClick={handleMinimize}
              aria-label={isMinimized ? 'Restore portfolio' : 'Minimize portfolio'}
              aria-pressed={isMinimized}
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
              className="window-frame__dot window-frame__dot--close"
              onClick={handleClose}
              aria-label="Close portfolio"
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
