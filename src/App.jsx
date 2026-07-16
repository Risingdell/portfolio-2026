import { useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from './utils/motion';
import { ThemeProvider } from './context/ThemeContext';
import { SectionProvider, useSection } from './context/SectionContext';
import ThemeToggle from './components/ThemeToggle';
import InfoPanel from './components/InfoPanel';
import SkillsPanel from './components/SkillsPanel';
import ProjectsPanel from './components/ProjectsPanel';
import ContactPanel from './components/ContactPanel';
import NavRail from './components/NavRail';
import ScrollArrow from './components/ScrollArrow';
import './styles/App.css';
import './styles/Portrait.css';

// Code-split: three.js + @react-three/fiber (the bulk of the bundle) only
// load once the hero actually needs them, not on initial page parse.
const Portrait = lazy(() => import('./components/Portrait'));

function PortraitFallback() {
  return (
    <div className="portrait">
      <div className="portrait__loading" role="status" aria-label="Loading portrait">
        <span className="portrait__loading-dot" />
        <span className="portrait__loading-dot" />
        <span className="portrait__loading-dot" />
      </div>
    </div>
  );
}

/* ===== Stage layouts ===== */

// Hero: portrait only, centered, full width
function HeroStage() {
  return (
    <div className="stage stage--hero">
      <div className="stage__portrait-full">
        <Suspense fallback={<PortraitFallback />}>
          <Portrait />
        </Suspense>
      </div>
      <div className="stage__hero-name">
        <h1 className="stage__hero-title">Dhanush M</h1>
        <p className="stage__hero-tagline">Full Stack Developer &amp; System Builder</p>
      </div>
    </div>
  );
}

// About: InfoPanel takes full area (portrait was shown in hero)
function AboutStage() {
  return (
    <div className="stage stage--about">
      <InfoPanel />
    </div>
  );
}

// Skills
function SkillsStage() {
  return (
    <div className="stage stage--full">
      <SkillsPanel />
    </div>
  );
}

const stageComponents = {
  hero: HeroStage,
  about: AboutStage,
  skills: SkillsStage,
  projects: () => (
    <div className="stage stage--full">
      <ProjectsPanel />
    </div>
  ),
  contact: () => (
    <div className="stage stage--full">
      <ContactPanel />
    </div>
  ),
};

/* ===== Main Layout ===== */
function AppLayout() {
  const {
    activeIndex,
    displayStage,
    isLocked,
    commitTransition,
    finishTransition,
    goNext,
    goPrev,
  } = useSection();

  const contentRef = useRef(null);
  const prevActiveRef = useRef(activeIndex);
  const wheelCooldown = useRef(false);
  const touchStartY = useRef(0);
  const touchTarget = useRef(null);

  // Melt transition
  useEffect(() => {
    if (activeIndex === prevActiveRef.current) return;

    const content = contentRef.current;
    if (!content) return;

    const direction = activeIndex > prevActiveRef.current ? 1 : -1;
    prevActiveRef.current = activeIndex;

    const reduceMotion = prefersReducedMotion();
    const tl = gsap.timeline();

    if (reduceMotion) {
      // Simple crossfade — skip the transform/blur choreography for motion-sensitive users
      tl.to(content, { opacity: 0, duration: 0.12, ease: 'none' });
      tl.call(() => commitTransition());
      tl.to(content, { opacity: 1, duration: 0.12, ease: 'none' });
      tl.call(() => finishTransition());
      return () => tl.kill();
    }

    // Melt OUT
    tl.to(content, {
      opacity: 0,
      y: direction * -120,
      scale: 0.98,
      skewY: direction * 2,
      filter: 'blur(10px)',
      duration: 0.35,
      ease: 'power2.in',
    });

    // Swap content
    tl.call(() => commitTransition());

    // Reset position
    tl.set(content, {
      y: direction * 80,
      scale: 1,
      skewY: 0,
      filter: 'blur(0px)',
    });

    // Fade IN
    tl.to(content, {
      delay: 0.05,
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
    });

    // Unlock
    tl.call(() => finishTransition());

    return () => tl.kill();
  }, [activeIndex, commitTransition, finishTransition]);

  // Input handlers
  const handleWheel = useCallback((e) => {
    if (isLocked() || wheelCooldown.current) return;
    if (Math.abs(e.deltaY) < 30) return;

    // Check if scroll is inside a scrollable panel (e.g. info-panel__content)
    const scrollable = e.target.closest('.info-panel__content, .skills-panel__content');
    if (scrollable) {
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 2;

      // Scrolling down but panel hasn't reached bottom — let it scroll
      if (e.deltaY > 0 && !atBottom) return;
      // Scrolling up but panel hasn't reached top — let it scroll
      if (e.deltaY < 0 && !atTop) return;
    }

    // Check if scroll is inside horizontal projects track
    const hTrack = e.target.closest('.projects-panel__track');
    if (hTrack) {
      const { scrollLeft, scrollWidth, clientWidth } = hTrack;
      const atStart = scrollLeft <= 0;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;

      if (e.deltaY > 0 && !atEnd) return;
      if (e.deltaY < 0 && !atStart) return;
    }

    wheelCooldown.current = true;
    setTimeout(() => { wheelCooldown.current = false; }, 900);

    if (e.deltaY > 0) goNext();
    else goPrev();
  }, [isLocked, goNext, goPrev]);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchTarget.current = e.target;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (isLocked()) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) < 50) return;

    // Check if touch started inside a scrollable panel
    const scrollable = touchTarget.current?.closest('.info-panel__content, .skills-panel__content');
    if (scrollable) {
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 2;
      if (delta > 0 && !atBottom) return;
      if (delta < 0 && !atTop) return;
    }

    // Check if touch started inside horizontal projects track
    const hTrack = touchTarget.current?.closest('.projects-panel__track');
    if (hTrack) {
      const { scrollLeft, scrollWidth, clientWidth } = hTrack;
      const atStart = scrollLeft <= 0;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
      if (delta > 0 && !atEnd) return;
      if (delta < 0 && !atStart) return;
    }

    if (delta > 0) goNext();
    else goPrev();
  }, [isLocked, goNext, goPrev]);

  const handleKeyDown = useCallback((e) => {
    if (isLocked()) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      goPrev();
    }
  }, [isLocked, goNext, goPrev]);

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleTouchStart, handleTouchEnd, handleKeyDown]);

  const StageComponent = stageComponents[displayStage];

  return (
    <div className="app">
      <ThemeToggle />

      <div className="app__layout">
        <div className="app__content" ref={contentRef}>
          <StageComponent key={displayStage} />
        </div>
        <div className="app__right">
          <NavRail />
        </div>
      </div>

      <ScrollArrow />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SectionProvider>
        <AppLayout />
      </SectionProvider>
    </ThemeProvider>
  );
}

export default App;
