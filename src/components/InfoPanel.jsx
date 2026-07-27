import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/motion';
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
  const contentRef = useRef(null);

  // Reveal the story in order: label, title, intro, then each content block.
  useEffect(() => {
    if (!contentRef.current || prefersReducedMotion()) return;
    const revealItems = contentRef.current.querySelectorAll('[data-reveal]');
    const timeline = gsap.timeline({ delay: 1 });

    timeline.fromTo(
      revealItems,
      { x: 64, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.42 }
    );

    return () => timeline.kill();
  }, []);

  return (
    <div className="info-panel">
      <div className="info-panel__content" ref={contentRef}>
        <span className="info-panel__label" data-reveal>ABOUT</span>
        <h2 className="info-panel__title" data-reveal>About Me</h2>
        <p className="info-panel__subtitle" data-reveal>
          A quick look at my background and what drives the way I build.
        </p>

        <div className="info-panel__section" data-reveal>
          <h3 className="info-panel__section-title">Overview</h3>
          <p className="info-panel__text">
            A results-driven developer focused on building real-world, scalable
            applications across web and desktop platforms. Passionate about clean
            architecture, efficient workflows, and creating systems that solve
            practical problems with precision and performance.
          </p>
        </div>

        <div className="info-panel__section" data-reveal>
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

        <div className="info-panel__section" data-reveal>
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
