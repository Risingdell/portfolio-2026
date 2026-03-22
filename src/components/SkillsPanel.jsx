import '../styles/SkillsPanel.css';

const skillCategories = [
  {
    title: 'Languages and Tools',
    items: [
      { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
      { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
      { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
      { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
      { name: 'Sass', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg' },
      { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
      { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
      { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
      { name: 'Vite', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg' },
      { name: 'Electron', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg' },
      { name: 'VS Code', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
    ],
  },
  {
    title: 'Libraries and Frameworks',
    items: [
      { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
      { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
      { name: 'Three.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/threejs/threejs-original.svg' },
      { name: 'Tailwind', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
      { name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg' },
      { name: 'Redux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg' },
    ],
  },
  {
    title: 'Databases',
    items: [
      { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
      { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
      { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
      { name: 'Elasticsearch', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg' },
    ],
  },
  {
    title: 'Other',
    items: [
      { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
      { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
      { name: 'Linux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
    ],
  },
];

export default function SkillsPanel() {
  return (
    <div className="skills-panel">
      <div className="skills-panel__content">
        <span className="skills-panel__label">SKILLS</span>
        <h2 className="skills-panel__title">My Skills</h2>
        <p className="skills-panel__subtitle">
          I like to take responsibility to craft aesthetic user experience using modern frontend architecture.
        </p>

        <div className="skills-panel__categories">
          {skillCategories.map(cat => (
            <div key={cat.title} className="skills-panel__category">
              <h3 className="skills-panel__category-title">{cat.title}</h3>
              <div className="skills-panel__grid">
                {cat.items.map(skill => (
                  <div key={skill.name} className="skills-panel__icon-card" title={skill.name}>
                    <img
                      src={skill.icon}
                      alt={skill.name}
                      className="skills-panel__icon-img"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative swirl */}
      <div className="skills-panel__decor" aria-hidden="true">
        <svg viewBox="0 0 200 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M180 0 C180 80, 40 120, 40 200 S180 280, 180 360 C180 400, 100 440, 60 480" stroke="var(--text-accent)" strokeWidth="1.5" opacity="0.3" />
          <path d="M200 0 C200 100, 20 140, 20 240 S200 320, 200 400 C200 440, 80 470, 40 500" stroke="var(--text-accent)" strokeWidth="1" opacity="0.15" />
          <circle cx="40" cy="200" r="30" stroke="var(--text-accent)" strokeWidth="1" opacity="0.2" fill="none" />
          <circle cx="60" cy="360" r="18" stroke="var(--text-accent)" strokeWidth="1" opacity="0.15" fill="none" />
        </svg>
      </div>
    </div>
  );
}
