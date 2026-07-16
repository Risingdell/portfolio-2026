import { useRef, useEffect, useCallback } from 'react';
import '../styles/ProjectsPanel.css';

const projects = [
  {
    title: 'ASKDB',
    tagline: 'Natural Language to SQL Converter',
    badge: '1st Place — DevAppSys Hackathon',
    description: 'End-to-end NL2SQL system converting plain English to SQL with live database results.',
    tech: ['React', 'Vite', 'Python', 'FastAPI', 'Node.js', 'PostgreSQL', 'Gemini API'],
    gradient: 'linear-gradient(135deg, #0f9b8e 0%, #2dd4bf 50%, #a7f3d0 100%)',
    link: null,
  },
  {
    title: 'Hotel AI Assistant',
    tagline: 'AI-Powered Restaurant System',
    badge: null,
    description: 'Full-stack restaurant assistant with Gemini AI chat, real-time Socket.IO updates, and multi-language support.',
    tech: ['React', 'Node.js', 'Express', 'MySQL', 'Gemini AI', 'Socket.IO', 'Tailwind'],
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)',
    link: null,
  },
  {
    title: 'Library Management',
    tagline: 'Full-Stack Library System',
    badge: null,
    description: 'Secure session-based auth, REST APIs for borrowing/returning, MySQL triggers for expiry management.',
    tech: ['React', 'Node.js', 'Express', 'MySQL'],
    gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 50%, #bfdbfe 100%)',
    link: 'https://lnkd.in/gsaiyqsZ',
  },
  {
    title: 'Electron Notepad',
    tagline: 'Desktop Notes Application',
    badge: null,
    description: 'Desktop notes app with auto-save, search, file upload, and clean custom UI for note management.',
    tech: ['Electron.js', 'Node.js', 'MySQL'],
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)',
    link: 'https://github.com/Risingdell/notepadGOLD',
  },
  {
    title: 'YOLOv5 Human Detection',
    tagline: 'Real-Time Detection WebApp',
    badge: null,
    description: 'Real-time human detection and counting via webcam using YOLOv5, with SQLite storage and web monitoring.',
    tech: ['Python', 'YOLOv5', 'SQLite', 'OpenCV'],
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #fecaca 100%)',
    link: null,
  },
  {
    title: 'Waste Management',
    tagline: 'Smart Waste Tracking System',
    badge: 'Selected — Anveshanam, Bangalore',
    description: 'Track, manage, and optimize waste collection and disposal efficiently.',
    tech: ['Full Stack'],
    gradient: 'linear-gradient(135deg, #059669 0%, #34d399 50%, #a7f3d0 100%)',
    link: null,
  },
  {
    title: 'Placement System',
    tagline: 'Placement Management Platform',
    badge: 'Ongoing — Internship',
    description: 'Student placement portal with profile management, drive tracking, JWT auth, and file uploads.',
    tech: ['Node.js', 'Express', 'MySQL', 'React'],
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 50%, #c7d2fe 100%)',
    link: null,
  },
];

export default function ProjectsPanel() {
  const trackRef = useRef(null);
  const targetScroll = useRef(0);
  const animFrame = useRef(null);
  const isAnimating = useRef(false);
  const animateRef = useRef(null);

  // Lerp animation loop for smooth scrolling
  const animate = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const current = track.scrollLeft;
    const diff = targetScroll.current - current;

    // Stop when close enough
    if (Math.abs(diff) < 0.5) {
      track.scrollLeft = targetScroll.current;
      isAnimating.current = false;
      return;
    }

    // Lerp — ease toward target (0.12 = smooth, higher = faster)
    track.scrollLeft = current + diff * 0.12;
    animFrame.current = requestAnimationFrame(() => animateRef.current());
  }, []);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  const startAnimation = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    animFrame.current = requestAnimationFrame(() => animateRef.current());
  }, []);

  // Convert vertical wheel to horizontal scroll inside the track
  const handleWheel = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return;

    // Only intercept if mouse is over the track
    if (!track.contains(e.target)) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = scrollWidth - clientWidth;
    const atStart = scrollLeft <= 0;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;

    // If at boundaries, let the global handler take over
    if (e.deltaY > 0 && atEnd) return;
    if (e.deltaY < 0 && atStart) return;

    // Prevent the global section-change handler
    e.stopPropagation();

    // Accumulate target and clamp
    targetScroll.current = Math.max(0, Math.min(targetScroll.current + e.deltaY * 2, maxScroll));
    startAnimation();
  }, [startAnimation]);

  // Sync targetScroll on mount
  useEffect(() => {
    if (trackRef.current) {
      targetScroll.current = trackRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Use capture phase to intercept before the global handler
    window.addEventListener('wheel', handleWheel, { capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [handleWheel]);

  return (
    <div className="projects-panel">
      <div className="projects-panel__header">
        <span className="projects-panel__label">PROJECTS</span>
        <h2 className="projects-panel__title">My Projects</h2>
        <p className="projects-panel__subtitle">
          Some things I&apos;ve built with love, expertise and a pinch of magical ingredients.
        </p>
      </div>

      <div className="projects-panel__track" ref={trackRef}>
        {projects.map((project) => (
          <div
            key={project.title}
            className="project-card"
            style={{ background: project.gradient }}
          >
            <div className="project-card__inner">
              <h3 className="project-card__title">{project.title}</h3>
              <p className="project-card__tagline">{project.tagline}</p>

              {project.badge && (
                <span className="project-card__badge">{project.badge}</span>
              )}

              <p className="project-card__desc">{project.description}</p>

              <div className="project-card__tech">
                {project.tech.map(t => (
                  <span key={t} className="project-card__tech-tag">{t}</span>
                ))}
              </div>

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-card__link"
                >
                  View Project ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="projects-panel__hint">
        <span>◂</span> Scroll to explore <span>▸</span>
      </div>
    </div>
  );
}
