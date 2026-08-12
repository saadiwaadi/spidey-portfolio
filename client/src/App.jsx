import { useState, useEffect, useRef } from 'react';
import cornerWebImg from './assets/corner web.png';
import cutoutSpideyImg from './assets/Cutout spidey.png';
import { fallbackProjects } from './ProjectData';
import './App.css';

function App() {
  const [projects, setProjects] = useState(fallbackProjects);
  const [activeSection, setActiveSection] = useState('hero');
  const [activeCartridgeIndex, setActiveCartridgeIndex] = useState(-1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [typedText, setTypedText] = useState('');

  const screenRef = useRef(null);
  const scrollInterval = useRef(null);
  const holdTimeout = useRef(null);
  const isHoldingRef = useRef(false);

  // Typing animation for Hero Title
  useEffect(() => {
    const nameText = "SAAD AHMAD";
    let charIndex = 0;
    let isDeleting = false;
    let timer;

    function typeEffect() {
      if (!isDeleting) {
        if (charIndex <= nameText.length) {
          setTypedText(nameText.substring(0, charIndex));
          charIndex++;
          timer = setTimeout(typeEffect, 120);
        } else {
          isDeleting = true;
          timer = setTimeout(typeEffect, 10000); // Hold for 10 seconds
        }
      } else {
        if (charIndex > 0) {
          setTypedText(nameText.substring(0, charIndex - 1));
          charIndex--;
          timer = setTimeout(typeEffect, 60);
        } else {
          isDeleting = false;
          timer = setTimeout(typeEffect, 500); // Wait 0.5s before typing again
        }
      }
    }

    timer = setTimeout(typeEffect, 200);
    return () => clearTimeout(timer);
  }, []);

  // Fetch projects from local server API
  useEffect(() => {
    async function loadProjects() {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      try {
        const res = await fetch(`${API_BASE}/projects`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setProjects(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch projects from API, using fallback data:', err);
      }
    }
    loadProjects();
  }, []);

  // Open modal if project query param matches
  useEffect(() => {
    if (projects.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const projectSlug = params.get('project');
      if (projectSlug) {
        const matched = projects.find(p => {
          const slug = p.title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
          return slug === projectSlug;
        });
        if (matched) {
          setSelectedProject(matched);
          setIsModalOpen(true);
        }
      }
    }
  }, [projects]);

  // Highlight active section using IntersectionObserver
  useEffect(() => {
    const sectionIds = ['profile', 'education', 'stats', 'work', 'projects', 'side-quests', 'contact'];

    // Add "hero" if we are scrolled to the top
    const observerOptions = {
      root: screenRef.current,
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveSection(id);

          // Clear cartridge highlight when scrolling out of projects section
          if (id !== 'projects') {
            setActiveCartridgeIndex(-1);
          }
        }
      });
    }, observerOptions);

    // Also observe hero
    const heroEl = document.getElementById('hero');
    if (heroEl) observer.observe(heroEl);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [projects]);

  // Jump to specific section element
  const jumpTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Continuous scrolling helpers
  const startScrolling = (dir) => {
    if (scrollInterval.current) clearInterval(scrollInterval.current);
    const speed = dir === 'down' ? 12 : -12;
    scrollInterval.current = setInterval(() => {
      if (screenRef.current) {
        screenRef.current.scrollTop += speed;
      }
    }, 16);
  };

  const stopScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const scrollStep = (dir) => {
    if (screenRef.current) {
      screenRef.current.scrollBy({
        top: dir === 'down' ? 150 : -150,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollPress = (dir, e) => {
    e.preventDefault();
    isHoldingRef.current = false;
    holdTimeout.current = setTimeout(() => {
      isHoldingRef.current = true;
      startScrolling(dir);
    }, 200);
  };

  const handleScrollRelease = (dir, e) => {
    e.preventDefault();
    clearTimeout(holdTimeout.current);
    if (isHoldingRef.current) {
      stopScrolling();
    } else {
      scrollStep(dir);
    }
    isHoldingRef.current = false;
  };

  // Project Cartridge cycling logic (for A button)
  const cycleProjects = () => {
    if (activeSection !== 'projects') {
      jumpTo('projects');
      setActiveCartridgeIndex(0);
    } else {
      const nextIdx = (activeCartridgeIndex + 1) % projects.length;
      setActiveCartridgeIndex(nextIdx);
    }
  };

  // Scroll to cartridge when activeCartridgeIndex changes
  useEffect(() => {
    if (activeCartridgeIndex >= 0 && projects[activeCartridgeIndex]) {
      const slug = projects[activeCartridgeIndex].title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
      const cartEl = document.querySelector(`.cartridge[data-project-id="${slug}"]`);
      if (cartEl) {
        cartEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeCartridgeIndex, projects]);

  // Open / close modal handlers
  const handleOpenCaseStudy = (project, e) => {
    if (e) e.preventDefault();
    if (!project) return;
    try {
      setSelectedProject(project);
      setIsModalOpen(true);
      // Update url parameter
      const slug = project.title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newUrl = `${window.location.pathname}?project=${slug}`;
      window.history.pushState({}, '', newUrl);
    } catch (err) {
      console.error('Error opening case study:', err);
    }
  };

  const handleCloseCaseStudy = () => {
    try {
      setIsModalOpen(false);
      setSelectedProject(null);
      // Clear url parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } catch (err) {
      console.error('Error closing case study:', err);
    }
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseCaseStudy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Copy email to clipboard and toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2500);
  };

  const handleMailClick = (e) => {
    e.preventDefault();
    const email = "saadahmad200555@gmail.com";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email)
        .then(() => showToast("EMAIL COPIED TO CLIPBOARD!"))
        .catch(() => fallbackCopyText(email));
    } else {
      fallbackCopyText(email);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("EMAIL COPIED TO CLIPBOARD!");
    } catch (err) {
      console.error('Fallback copying failed', err);
    }
    document.body.removeChild(textArea);
  };

  const parseTags = (tagsVal) => {
    if (Array.isArray(tagsVal)) return tagsVal;
    if (typeof tagsVal === 'string') {
      try {
        return JSON.parse(tagsVal);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const renderArchitectureList = (architecture) => {
    const items = parseTags(architecture);
    return items.map((item, idx) => {
      const colonIndex = item.indexOf(':');
      if (colonIndex !== -1) {
        const boldPart = item.substring(0, colonIndex);
        const restPart = item.substring(colonIndex + 1);
        return <li key={idx}><strong>{boldPart}:</strong>{restPart}</li>;
      }
      return <li key={idx}>{item}</li>;
    });
  };

  const renderDevLogText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        const headingText = trimmed.replace(/^###\s*/, '');
        return (
          <h6 key={idx} className="dev-log-h6" style={{ margin: '14px 0 6px 0', color: '#ffb000', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-pixel)' }}>
            {headingText}
          </h6>
        );
      }
      if (trimmed === '') {
        return <div key={idx} style={{ height: '8px' }} />;
      }

      // Process inline **bold** text
      const parts = line.split('**');
      const content = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i}>{part}</strong>;
        }
        return part;
      });

      return (
        <p key={idx} className="dev-log-p" style={{ margin: '0 0 4px 0', lineHeight: '1.6' }}>
          {content}
        </p>
      );
    });
  };


  const sectionIds = ['profile', 'education', 'stats', 'work', 'projects', 'side-quests', 'contact'];

  const tagClasses = {
    'LIVE': 'cart-tag--live',
    'RUNNING': 'cart-tag--run',
    'SHIPPED': 'cart-tag--ship',
    'PERSONAL': 'cart-tag--solo',
    'DESIGN': 'cart-tag--design'
  };

  return (
    <>
      {/* Fixed visual bezel overlay */}
      <div className="device-frame-overlay">
        <div className="bezel-screw screw-tl"></div>
        <div className="bezel-screw screw-tr"></div>
        <div className="bezel-screw screw-bl"></div>
        <div className="bezel-screw screw-br"></div>
      </div>

      <div className="device-bezel">
        <div className="device-screen-container">
          <div className="crt-overlay"></div>
          <div className="vignette"></div>
          <div className="screen-glass"></div>

          <div className="device-screen" ref={screenRef}>
            {/* TOP HEADER (desktop) */}
            <header className="top-header">
              <div className="wrap">

                <nav className="top-nav" id="top-nav">
                  <a
                    href="#profile"
                    onClick={(e) => { e.preventDefault(); jumpTo('profile'); }}
                    className={activeSection === 'profile' ? 'is-active' : ''}
                  >
                    Profile
                  </a>
                  <a
                    href="#education"
                    onClick={(e) => { e.preventDefault(); jumpTo('education'); }}
                    className={activeSection === 'education' ? 'is-active' : ''}
                  >
                    Education
                  </a>
                  <a
                    href="#stats"
                    onClick={(e) => { e.preventDefault(); jumpTo('stats'); }}
                    className={activeSection === 'stats' ? 'is-active' : ''}
                  >
                    Stats
                  </a>
                  <a
                    href="#work"
                    onClick={(e) => { e.preventDefault(); jumpTo('work'); }}
                    className={activeSection === 'work' ? 'is-active' : ''}
                  >
                    Work
                  </a>
                  <a
                    href="#projects"
                    onClick={(e) => { e.preventDefault(); jumpTo('projects'); }}
                    className={activeSection === 'projects' ? 'is-active' : ''}
                  >
                    Projects
                  </a>
                  <a
                    href="#side-quests"
                    onClick={(e) => { e.preventDefault(); jumpTo('side-quests'); }}
                    className={activeSection === 'side-quests' ? 'is-active' : ''}
                  >
                    Extras
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => { e.preventDefault(); jumpTo('contact'); }}
                    className={activeSection === 'contact' ? 'is-active' : ''}
                  >
                    Contact
                  </a>
                </nav>
                <div className="header-status">
                  <span className="dot"></span>
                  <span className="status-text">ONLINE</span>
                </div>
              </div>
            </header>

            <main>
              {/* HERO */}
              <section id="hero" className="hero">
                <div className="hero-grid-bg"></div>
                <img src={cornerWebImg} className="hero-corner-web" alt="Corner Web" />
                <div className="wrap">

                  <div className="hero-text-col">
                    <div className="hero-kicker"><span className="console-dot"></span>LAHORE, PAKISTAN — NEW GAME</div>
                    <h1 className="hero-title">{typedText}<span className="cursor"></span></h1>
                    <p className="hero-role">FULL-STACK DEVELOPER &amp; FOUNDER</p>
                    <p className="hero-copy">
                      Full-Stack Developer | Building Production-Grade Systems — POS, ERP &amp; Predictive Engines | React · Electron · SQLite · Python | Creative Storyteller (Video &amp; Brand)
                    </p>
                    <div className="hero-ctas">
                      <a href="#projects" onClick={(e) => { e.preventDefault(); jumpTo('projects'); }} className="pixel-btn pixel-btn--yellow">▶ View Projects</a>
                      <a href="#contact" onClick={(e) => { e.preventDefault(); jumpTo('contact'); }} className="pixel-btn pixel-btn--ghost">✉ Contact</a>
                    </div>
                  </div>
                  <div className="hero-image-col">
                    {/* <img src={cutoutSpideyImg} alt="Saad Ahmad" /> */}
                  </div>
                </div>
              </section>

              {/* PROFILE */}
              <section id="profile" className="section">
                <div className="wrap">
                  <div className="eyebrow">PROFILE.TXT</div>
                  <div className="profile-grid">
                    <h2 className="section-title section-title-inline" style={{ marginBottom: 0 }}>Who's Playing</h2>
                    <div className="profile-copy">
                      <p>
                        I’m a full-stack developer and the person behind <strong>BitLogicHub</strong>, where I build software that actually gets used — from POS and ERP systems to CRM and business tools.
                      </p>
                      <p>
                        I like working across the whole stack, getting into everything from databases and backend logic to interfaces and the small details that make a system feel right. I’m especially interested in building things that solve real problems rather than just looking good in a demo.
                      </p>
                      <p>
                        Outside of client work, I like experimenting with things that are a little more unusual — statistical models, football analytics, simulations, and whatever else catches my curiosity.
                      </p>
                      <p>
                        Basically, I like building useful things, figuring out how they work, and occasionally making them unnecessarily interesting.
                      </p>
                    </div>
                    <div className="profile-sidebar">
                      <div className="panel panel--raised" style={{ marginBottom: '16px' }}>
                        <ul className="facts-list">
                          <li><span className="k">LOCATION</span><span className="v">Lahore, Pakistan</span></li>
                          <li><span className="k">ROLE</span><span class="v">Founder, BitLogicHub</span></li>
                          <li><span className="k">FOCUS</span><span class="v">POS · ERP · CRM · ML</span></li>
                          <li>
                            <span className="k">EMAIL</span>
                            <a className="v" href="mailto:saadahmad200555@gmail.com" onClick={handleMailClick}>
                              saadahmad200555@gmail.com
                            </a>
                          </li>
                          <li><span className="k">PHONE</span><span className="v">+92 317 8440437</span></li>
                          <li>
                            <span className="k">GITHUB</span>
                            <a className="v" href="https://github.com/saadiwaadi" target="_blank" rel="noopener noreferrer">
                              github.com/saadiwaadi
                            </a>
                          </li>
                          <li>
                            <span className="k">LINKEDIN</span>
                            <a className="v" href="https://www.linkedin.com/in/saad-ahmad-a99532279" target="_blank" rel="noopener noreferrer">
                              in/saad-ahmad
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="panel panel--raised">
                        <div className="eyebrow" style={{ marginBottom: '8px' }}>CURRENT_FOCUS</div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>
                          Actively researching robust offline-first synchronization patterns and lightweight ML deployments.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* EDUCATION */}
              <section id="education" className="section">
                <div className="wrap">
                  <div className="eyebrow">ACADEMICS.TXT</div>
                  <h2 className="section-title">Education</h2>
                  <div className="panel">
                    <ul className="facts-list">
                      <li><span className="k">INSTITUTION</span><span className="v">University of Lahore</span></li>
                      <li><span className="k">DEGREE</span><span className="v">Bachelor of Science in Computer Science (BS CS)</span></li>
                      <li><span className="k">GRADUATION</span><span className="v">[YEAR]</span></li>
                      <li>
                        <span className="k">CORE_STUDIES</span>
                        <span className="v">Data Structures · Database Systems · Software Engineering</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* STATS */}
              <section id="stats" className="section">
                <div className="wrap">
                  <div className="eyebrow">SKILLS.DAT</div>
                  <h2 className="section-title">Player Card</h2>

                  <div className="stats-layout">
                    <div className="stat-card">
                      <div className="stat-card-top">
                        <div className="stat-ovr"><span className="num">83</span><span className="lbl">OVR</span></div>
                        <div className="stat-name">
                          <div className="n">S. AHMAD</div>
                          <div className="pos">POS: FULL-STACK / FOUNDER</div>
                        </div>
                      </div>
                      <div className="stat-rows">
                        <div className="stat-row">
                          <span className="abbr">SYS</span><span className="val">3 Systems</span>
                          <div className="stat-bar-bg">
                            <div className="stat-bar-fill" style={{ width: '90%' }}></div>
                          </div>
                        </div>
                        <div className="stat-row">
                          <span className="abbr">LCP</span><span className="val">2 Clients</span>
                          <div className="stat-bar-bg">
                            <div className="stat-bar-fill" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                        <div className="stat-row">
                          <span className="abbr">FIN</span><span className="val">4 Modules</span>
                          <div className="stat-bar-bg">
                            <div className="stat-bar-fill" style={{ width: '95%' }}></div>
                          </div>
                        </div>
                        <div className="stat-row">
                          <span className="abbr">ACC</span><span className="val">~61% Acc</span>
                          <div className="stat-bar-bg">
                            <div className="stat-bar-fill" style={{ width: '61%' }}></div>
                          </div>
                        </div>
                        <div className="stat-row">
                          <span className="abbr">STK</span><span className="val">8 Tools</span>
                          <div className="stat-bar-bg">
                            <div className="stat-bar-fill" style={{ width: '80%' }}></div>
                          </div>
                        </div>
                        <div className="stat-row">
                          <span className="abbr">YRS</span><span className="val">3+ Years</span>
                          <div className="stat-bar-bg">
                            <div className="stat-bar-fill" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="stat-card-foot">
                        <span>BITLOGICHUB FC</span>
                      </div>
                    </div>

                    <div className="skills-legend">
                      <div className="legend-item">
                        <h3>LANGUAGES</h3>
                        <div className="chip-row">
                          <span className="chip">JavaScript / TypeScript</span>
                          <span className="chip">Python</span>
                          <span className="chip">SQL</span>
                        </div>
                      </div>
                      <div className="legend-item">
                        <h3>FRONTEND</h3>
                        <div className="chip-row">
                          <span className="chip">React</span>
                          <span className="chip">Vue 3</span>
                          <span className="chip">Tailwind CSS</span>
                        </div>
                      </div>
                      <div className="legend-item">
                        <h3>BACKEND</h3>
                        <div className="chip-row">
                          <span className="chip">Node.js / Express</span>
                          <span className="chip">Django</span>
                          <span className="chip">Electron</span>
                        </div>
                      </div>
                      <div className="legend-item">
                        <h3>DATA &amp; INFRA</h3>
                        <div className="chip-row">
                          <span className="chip">PostgreSQL</span>
                          <span className="chip">SQLite</span>
                          <span className="chip">Supabase</span>
                          <span className="chip">Docker</span>
                          <span className="chip">Railway</span>
                          <span className="chip">Vercel</span>
                          <span className="chip">GitHub Actions</span>
                          <span className="chip">BullMQ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* WORK */}
              <section id="work" className="section">
                <div className="wrap">
                  <div className="eyebrow">EXPERIENCE.LOG</div>
                  <h2 className="section-title">Quest Log</h2>
                  <div className="panel">
                    <div className="quest-head">
                      <h3>Founder &amp; Full-Stack Developer — BitLogicHub</h3>
                      <span className="dates">2023 — PRESENT</span>
                    </div>
                    <p className="quest-sub">
                      Running a software studio delivering custom POS, ERP and CRM systems for SME clients —
                      requirements through architecture through deployment.
                    </p>
                    <ul className="quest-list">
                      <li>
                        <span className="quest-check">✓</span>
                        <div>
                          <p><strong>Cheema Traders POS</strong> — Rebuilt all core transaction write paths and ledger systems:</p>
                          <ul style={{ margin: '8px 0 0', paddingLeft: '20px', listStyleType: 'square', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                            <li>Converted sales, customer payments, supplier payments, and expenses to atomic transactions, resolving a silent general-ledger desync bug.</li>
                            <li>Added an inline GL ledger panel with Excel/PDF export capabilities.</li>
                            <li>Designed a custom partial-return system to handle product returns smoothly.</li>
                          </ul>
                        </div>
                      </li>
                      <li>
                        <span className="quest-check">✓</span>
                        <div>
                          <p><strong>River View ERP</strong> — Conducted a full financial integrity audit and resolved ledger discrepancies:</p>
                          <ul style={{ margin: '8px 0 0', paddingLeft: '20px', listStyleType: 'square', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                            <li>Audited ledger transactions and resolved six confirmed bugs, including orphaned payment records.</li>
                            <li>Fixed a critical trial-balance discrepancy originating from missing late-fee postings.</li>
                            <li>Shipped a discount/amnesty scheme with per-plot exclusions and context-aware validation.</li>
                          </ul>
                        </div>
                      </li>
                      <li>
                        <span className="quest-check">✓</span>
                        <div>
                          <p><strong>ORACLE-26</strong> — Built and validated a Dixon-Coles match prediction engine:</p>
                          <ul style={{ margin: '8px 0 0', paddingLeft: '20px', listStyleType: 'square', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                            <li>Developed a Poisson model with opponent-adjusted lambdas and live-form data.</li>
                            <li>Automated ingestion pipelines using five scheduled scrapers triggered by GitHub Actions.</li>
                            <li>Conducted mutation testing (mutmut) to achieve a high ~70% mutation score.</li>
                          </ul>
                        </div>
                      </li>
                      <li>
                        <span className="quest-check">✓</span>
                        <div>
                          <p><strong>CarrierLens</strong> — Designed the full production architecture end-to-end:</p>
                          <ul style={{ margin: '8px 0 0', paddingLeft: '20px', listStyleType: 'square', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                            <li>Designed infrastructure scaling paths from a React/Vite Vercel frontend to Railway-hosted Express backend servers.</li>
                            <li>Configured Supabase for persistent storage and BullMQ workers for async background job execution.</li>
                          </ul>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* PROJECTS */}
              <section id="projects" className="section">
                <div className="wrap">
                  <div className="eyebrow">PROJECTS.BIN</div>
                  <div className="cart-grid">
                    {projects.map((project, idx) => {
                      const slug = project.title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
                      const isHighlighted = idx === activeCartridgeIndex;
                      const tagClass = tagClasses[project.status.toUpperCase()] || 'cart-tag--live';
                      const parsedTags = parseTags(project.tags);

                      return (
                        <article
                          key={slug}
                          className={`cartridge ${isHighlighted ? 'is-featured-cartridge' : ''}`}
                          data-project-id={slug}
                        >
                          <div className="cart-top">
                            <h3>{project.title}</h3>
                            <span className={`cart-tag ${tagClass}`}>{project.status.toUpperCase()}</span>
                          </div>
                          <p>{project.description}</p>
                          <div className="chip-row">
                            {parsedTags.map((t) => (
                              <span key={t} className="chip">{t}</span>
                            ))}
                          </div>
                          {project.live_link ? (
                            <div className="project-btn-row">
                              <a
                                href={`?project=${slug}`}
                                onClick={(e) => handleOpenCaseStudy(project, e)}
                                className="pixel-btn pixel-btn--sm pixel-btn--ghost toggle-case-study"
                              >
                                ▶ CASE STUDY
                              </a>
                              <a
                                href={project.live_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pixel-btn pixel-btn--sm pixel-btn--yellow"
                              >
                                ▶ VISIT SITE
                              </a>
                            </div>
                          ) : (
                            <a
                              href={`?project=${slug}`}
                              onClick={(e) => handleOpenCaseStudy(project, e)}
                              className="pixel-btn pixel-btn--sm pixel-btn--ghost toggle-case-study"
                              style={{ marginTop: '14px', width: '100%', textAlign: 'center' }}
                            >
                              ▶ VIEW CASE STUDY
                            </a>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* SIDE QUESTS */}
              <section id="side-quests" className="section">
                <div className="wrap">
                  <div className="eyebrow" style={{ justifyContent: 'center' }}>SIDE_QUESTS.LOG</div>
                  <h2 className="section-title" style={{ textAlign: 'center' }}>Extra Lives</h2>
                  <div className="panel" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
                    <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6, color: 'var(--text)' }}>
                      When I’m away from the keyboard, I’m usually somewhere between a football pitch, a camera, and a half-finished idea. I’m into football, films, photography, writing, and anything that gives me an excuse to make something. I like stories, good visuals, and noticing the little details that most people tend to overlook. Usually there’s a new idea somewhere in the notes app waiting to become a project.
                    </p>
                  </div>
                </div>
              </section>

              {/* CONTACT */}
              <section id="contact" className="section">
                <div className="wrap">
                  <div className="panel contact-panel">
                    <div className="eyebrow" style={{ justifyContent: 'center' }}>SAVE FILE</div>
                    <h2 className="section-title">Continue The Game?</h2>
                    <p className="contact-sub">Open to new builds, hard bugs, and anything football-shaped.</p>
                    <div className="contact-actions">
                      <a className="pixel-btn pixel-btn--yellow" href="mailto:saadahmad200555@gmail.com" onClick={handleMailClick}>
                        ✉ Email Me
                      </a>
                      <a className="pixel-btn pixel-btn--teal" href="https://github.com/saadiwaadi" target="_blank" rel="noopener noreferrer">
                        GitHub
                      </a>
                      <a className="pixel-btn pixel-btn--ghost" href="https://www.linkedin.com/in/saad-ahmad-a99532279" target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </div>
                    <div className="contact-meta">
                      <span>Lahore, Pakistan</span>
                      <span>+92 317 8440437</span>
                      <a href="mailto:saadahmad200555@gmail.com" onClick={handleMailClick}>saadahmad200555@gmail.com</a>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <footer>
              © 2026 SAAD AHMAD — ALL RIGHTS RESERVED <span className="save-blip">■</span> PRESS START TO SCROLL UP
            </footer>
          </div> {/* device-screen */}
        </div> {/* device-screen-container */}
      </div> {/* device-bezel */}

      {/* CASE STUDY MODAL */}
      <div className={`modal-overlay ${isModalOpen ? 'is-visible' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) handleCloseCaseStudy(); }}>
        {selectedProject && (
          <div className="modal-container">
            <div className="modal-header">
              <h4 className="modal-title" id="modal-title-text">
                {(selectedProject.title).toUpperCase()} — CASE STUDY
              </h4>
              <button className="modal-close-btn" onClick={handleCloseCaseStudy} aria-label="Close Case Study">✕</button>
            </div>
            <div className="modal-body" id="modal-body-content">
              <div className="dev-log-title">[DEVELOPER LOG: CASE STUDY]</div>
              <div className="dev-log-section">
                <div className="dev-log-h5">PROJECT OVERVIEW</div>
                {renderDevLogText(selectedProject.overview || '')}
              </div>
              <div className="dev-log-section">
                <div className="dev-log-h5">TECHNICAL ARCHITECTURE</div>
                <ul className="dev-log-list">
                  {renderArchitectureList(selectedProject.architecture)}
                </ul>
              </div>
              <div className="dev-log-section">
                <div className="dev-log-h5">TECHNOLOGY STACK</div>
                {renderDevLogText(selectedProject.tech_stack || '')}
              </div>
              <div className="dev-log-section">
                <div className="dev-log-h5">KEY FEATURES</div>
                <ul className="dev-log-list">
                  {renderArchitectureList(selectedProject.features)}
                </ul>
              </div>
              <div className="dev-log-section">
                <div className="dev-log-h5">ENGINEERING CHALLENGES</div>
                {renderDevLogText(selectedProject.challenges || '')}
              </div>
              <div className="dev-log-section">
                <div className="dev-log-h5">DESIGN DECISIONS</div>
                {renderDevLogText(selectedProject.decisions || '')}
              </div>
              {selectedProject.performance && (
                <div className="dev-log-section">
                  <div className="dev-log-h5">PERFORMANCE &amp; SCALABILITY</div>
                  {renderDevLogText(selectedProject.performance)}
                </div>
              )}
              <div className="dev-log-section">
                <div className="dev-log-h5">WHAT I LEARNED</div>
                {renderDevLogText(selectedProject.learnings || '')}
              </div>
              {selectedProject.still_working && (
                <div className="dev-log-section">
                  <div className="dev-log-h5">STILL BEING WORKED ON</div>
                  {renderDevLogText(selectedProject.still_working)}
                </div>
              )}
              {selectedProject.future_work && (
                <div className="dev-log-section">
                  <div className="dev-log-h5">FUTURE WORK</div>
                  {renderDevLogText(selectedProject.future_work)}
                </div>
              )}
              {selectedProject.status_detail && (
                <div className="dev-log-section">
                  <div className="dev-log-h5">STATUS DETAIL</div>
                  {renderDevLogText(selectedProject.status_detail)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RETRO TOAST NOTIFICATION */}
      <div className={`retro-toast ${isToastVisible ? 'is-visible' : ''}`}>
        {toastMessage}
      </div>

      {/* GAMEBOY CONSOLE (mobile controls) */}
      <div className="gameboy-console" aria-label="Console navigation">
        <div className="console-bezel-edge"></div>

        <div className="gbc-bezel">
          <div className="dpad-housing">
            <div className="dpad">
              <button
                className="dpad-up"
                onMouseDown={(e) => handleScrollPress('up', e)}
                onMouseUp={(e) => handleScrollRelease('up', e)}
                onMouseLeave={stopScrolling}
                onTouchStart={(e) => handleScrollPress('up', e)}
                onTouchEnd={(e) => handleScrollRelease('up', e)}
                onTouchCancel={stopScrolling}
                aria-label="Scroll up"
              >
                ▲
              </button>
              <button className="dpad-left" onClick={() => jumpTo('hero')} aria-label="Go to top">◀</button>
              <div className="dpad-hub"><span className="dot"></span></div>
              <button className="dpad-right" onClick={() => jumpTo('contact')} aria-label="Go to end">▶</button>
              <button
                className="dpad-down"
                onMouseDown={(e) => handleScrollPress('down', e)}
                onMouseUp={(e) => handleScrollRelease('down', e)}
                onMouseLeave={stopScrolling}
                onTouchStart={(e) => handleScrollPress('down', e)}
                onTouchEnd={(e) => handleScrollRelease('down', e)}
                onTouchCancel={stopScrolling}
                aria-label="Scroll down"
              >
                ▼
              </button>
            </div>
          </div>

          <div className="ss-group">
            <div className="ss-item">
              <button className="ss-pill" onClick={() => jumpTo('contact')} aria-label="Select: contact"></button>
              <span className="ss-lbl">CONTACT</span>
            </div>
            <div className="ss-item">
              <button className="ss-pill" onClick={() => jumpTo('hero')} aria-label="Start: top"></button>
              <span className="ss-lbl">START</span>
            </div>
          </div>

          <div className="ab-group">
            <div className="ab-item">
              <button className="ab-btn ab-b" onClick={() => jumpTo('stats')} aria-label="B: stats"></button>
              <span className="ab-lbl">PLAYER</span>
            </div>
            <div className="ab-item">
              <button className="ab-btn ab-a" onClick={cycleProjects} aria-label="A: cycle projects"></button>
              <span className="ab-lbl">PROJECTS</span>
            </div>
          </div>
        </div>

        <div className="console-labels" id="console-labels">
          {sectionIds.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => { e.preventDefault(); jumpTo(id); }}
              className={activeSection === id ? 'is-active' : ''}
            >
              {id.toUpperCase().replace('-', ' ')}
            </a>
          ))}
        </div>
      </div>

      {/* DESKTOP TICKER CONSOLE */}
      <div className="ticker-console" aria-label="Desktop console navigation">
        <div className="ticker-bezel">
          <button
            className="ticker-cell"
            onMouseDown={(e) => handleScrollPress('up', e)}
            onMouseUp={(e) => handleScrollRelease('up', e)}
            onMouseLeave={stopScrolling}
            onTouchStart={(e) => handleScrollPress('up', e)}
            onTouchEnd={(e) => handleScrollRelease('up', e)}
            onTouchCancel={stopScrolling}
            aria-label="Scroll up"
          >
            ▲ SCROLL
          </button>
          <button className="ticker-cell" onClick={() => jumpTo('hero')} aria-label="Go to top">◀ TOP</button>
          <button className="ticker-cell" onClick={cycleProjects} aria-label="Go to projects">▶ PROJECTS</button>
          <div className="ticker-mute" role="button" aria-label="Toggle sound" onClick={toggleMute}>
            {isMuted ? '🔇' : '🔊'}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
