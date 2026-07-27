import { useCallback, useEffect } from 'react';
import '../styles/NotFoundPage.css';

export default function NotFoundPage() {
  const refreshPortfolio = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      refreshPortfolio();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshPortfolio]);

  return (
    <main className="not-found" aria-labelledby="not-found-title">
      <section className="not-found__terminal">
        <p className="not-found__prompt">system@portfolio:~$ status</p>
        <h1 id="not-found-title" className="not-found__title">404 — PAGE NOT AVAILABLE</h1>
        <button type="button" className="not-found__refresh" onClick={refreshPortfolio}>
          <span>system@portfolio:~$</span> try refreshing in terminal<span className="not-found__cursor" aria-hidden="true">_</span>
        </button>
        <div className="not-found__status" aria-hidden="true">
          <span className="not-found__status-dot" />
          <span className="not-found__status-dot" />
          <span className="not-found__status-dot" />
        </div>
      </section>
    </main>
  );
}
