import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import '../styles/InfoPanel.css';

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
        <h1 className="info-panel__name">Dhanush M</h1>
        <p className="info-panel__tagline">Full Stack Developer &amp; System Builder</p>

        <hr className="info-panel__divider" />

        <h2 className="info-panel__section-title">About</h2>
        <p className="info-panel__text">
          A results-driven developer focused on building real-world, scalable
          applications across web and desktop platforms. Passionate about clean
          architecture, efficient workflows, and creating systems that solve
          practical problems with precision and performance.
        </p>

        <h2 className="info-panel__section-title">Education</h2>
        <p className="info-panel__text">
          Bachelor of Engineering in Artificial Intelligence &amp; Data Science
          <br />
          <span className="info-panel__highlight">CGPA: 8.24</span>
        </p>

        <h2 className="info-panel__section-title">Interests</h2>
        <div className="info-panel__tags">
          <span className="info-panel__tag">Full Stack Development</span>
          <span className="info-panel__tag">Backend Engineering</span>
          <span className="info-panel__tag">AI Integration</span>
          <span className="info-panel__tag">System Design</span>
          <span className="info-panel__tag">UI/UX Engineering</span>
          <span className="info-panel__tag">Automation</span>
        </div>

        <hr className="info-panel__divider" />

        <h2 className="info-panel__section-title">Summary</h2>
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
  );
}
