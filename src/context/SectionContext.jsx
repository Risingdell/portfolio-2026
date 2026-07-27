import { createContext, useContext, useRef, useState, useCallback } from 'react';

const SectionContext = createContext();

// Internal stages — hero & about are both "home" in the nav
const STAGES = ['hero', 'about', 'skills', 'projects', 'contact', 'playground'];

// Map internal stage to nav section
const STAGE_TO_NAV = {
  hero: 'home',
  about: 'home',
  skills: 'skills',
  projects: 'projects',
  contact: 'contact',
  playground: 'playground',
};

// Nav items and their first stage
const NAV_TO_STAGE = {
  home: 0,      // hero
  skills: 2,
  projects: 3,
  contact: 4,
  playground: 5,
};

export function SectionProvider({ children }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const lockRef = useRef(false);

  const activeStage = STAGES[activeIndex];
  const displayStage = STAGES[displayIndex];
  const activeNavSection = STAGE_TO_NAV[activeStage];

  const requestTransition = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;
    if (targetIndex === activeIndex || lockRef.current) return;
    lockRef.current = true;
    setActiveIndex(targetIndex);
  }, [activeIndex]);

  const commitTransition = useCallback(() => {
    setDisplayIndex(activeIndex);
  }, [activeIndex]);

  const finishTransition = useCallback(() => {
    lockRef.current = false;
  }, []);

  const isLocked = () => lockRef.current;

  const goToSection = useCallback((navId) => {
    const idx = NAV_TO_STAGE[navId];
    if (idx === undefined) return;
    requestTransition(idx);
  }, [requestTransition]);

  const goNext = useCallback(() => {
    requestTransition(activeIndex + 1);
  }, [activeIndex, requestTransition]);

  const goPrev = useCallback(() => {
    requestTransition(activeIndex - 1);
  }, [activeIndex, requestTransition]);

  return (
    <SectionContext.Provider value={{
      stages: STAGES,
      activeIndex,
      displayIndex,
      activeStage,
      displayStage,
      activeNavSection,
      isLocked,
      commitTransition,
      finishTransition,
      goToSection,
      goNext,
      goPrev,
    }}>
      {children}
    </SectionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is tightly coupled to SectionProvider; splitting into a separate file adds indirection with no benefit at this app's size
export function useSection() {
  const ctx = useContext(SectionContext);
  if (!ctx) throw new Error('useSection must be used within SectionProvider');
  return ctx;
}
