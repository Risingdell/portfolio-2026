import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import '../styles/InfoPanel.css';

const interests = [
  { name: 'Full Stack Development', color: '#00dcff' },
  { name: 'Backend Engineering', color: '#10b981' },
  { name: 'AI Integration', color: '#818cf8' },
  { name: 'System Design', color: '#ffa116' },
  { name: 'UI/UX Engineering', color: '#f472b6' },
  { name: 'Automation', color: '#34d399' },
];

export default function InfoPanel() {
  const panelRef = useRef(null);

  // Entrance animation
  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { x: 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.5 }
    );
  }, []);

  return (
    <div className="info-panel" ref={panelRef}>
      <div className="info-panel__content">
        <span className="info-panel__label">ABOUT</span>
        <h2 className="info-panel__title">About Me</h2>
        <p className="info-panel__subtitle">
          A quick look at my background, education, and what drives the way I build.
        </p>

        <div className="info-panel__section">
          <h3 className="info-panel__section-title">Overview</h3>
          <p className="info-panel__text">
            A results-driven developer focused on building real-world, scalable
            applications across web and desktop platforms. Passionate about clean
            architecture, efficient workflows, and creating systems that solve
            practical problems with precision and performance.
          </p>
        </div>

        <div className="info-panel__section">
          <h3 className="info-panel__section-title">Education</h3>
          <div className="info-panel__edu-card">
            <span className="info-panel__edu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
              </svg>
            </span>
            <div className="info-panel__edu-info">
              <span className="info-panel__edu-degree">
                Bachelor of Engineering in Artificial Intelligence &amp; Data Science
              </span>
              <span className="info-panel__edu-cgpa">CGPA: 8.24</span>
            </div>
          </div>
        </div>

        <div className="info-panel__section">
          <h3 className="info-panel__section-title">Interests</h3>
          <div className="info-panel__tags">
            {interests.map(tag => (
              <span
                key={tag.name}
                className="info-panel__tag"
                style={{ '--tag-color': tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="info-panel__section">
          <h3 className="info-panel__section-title">Summary</h3>
          <p className="info-panel__text">
            I specialize in designing and building end-to-end systems that combine
            robust backend logic with intuitive user experiences. From developing a
            full-scale Library Management System with automated workflows and secure
            authentication, to creating an AI-powered Natural Language to SQL platform
            that won 1st place at a national hackathon, I focus on solving complex
            problems with structured and scalable solutions.
          </p>
          <p className="info-panel__text" style={{ marginTop: '1rem' }}>
            I enjoy working across the entire stack — engineering APIs, optimizing
            databases, and crafting responsive interfaces — while ensuring
            maintainability and performance. Whether it's integrating AI into
            real-world applications or building desktop tools with Electron, I bring
            a balance of technical depth and practical execution to every project.
          </p>
        </div>
      </div>

      {/* Decorative glow orbs — echoes Contact's pulsing rings with a softer, warmer treatment */}
      <div className="info-panel__decor" aria-hidden="true">
        <div className="info-panel__orb info-panel__orb--1" />
        <div className="info-panel__orb info-panel__orb--2" />
      </div>
    </div>
  );
}
