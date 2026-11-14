import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  FolderGit2,
  GitBranch,
  Github,
  Globe2,
  Layers3,
  LockKeyhole,
  Rocket,
  Server,
  Terminal,
  Zap,
} from "lucide-react";
import "./marketing.css";

export default function Homepage() {
  return (
    <div className="marketing">
      <div className="announcement">
        <span className="announcement-dot" /> A simpler home for your next
        project.
        <a href="#how-it-works">
          Meet Dashpack <ArrowRight size={13} />
        </a>
      </div>
      <header className="marketing-nav">
        <Link href="/" className="marketing-brand">
          <Layers3 size={25} strokeWidth={2.4} />
          dashpack<span>.</span>
        </Link>
        <nav aria-label="Website navigation">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQs</a>
        </nav>
        <div className="marketing-nav-actions">
          <Link href="/login" className="login-link">
            Log in <ArrowUpRight size={13} />
          </Link>
          <Link href="/signup" className="marketing-button compact">
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-kicker">
            <span>
              <Rocket size={12} /> BUILT FOR BUILDERS
            </span>
            <span className="kicker-divider" /> Less setup. More shipping.
          </div>
          <h1>
            Your next big thing.
            <br />
            <span>Live in a few clicks.</span>
            <svg
              className="hero-spark"
              viewBox="0 0 50 60"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 28 4 20M25 20l1-14M37 29l10-8M35 44l11 3"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <p className="hero-description">
            Give your code a place to run. Dashpack detects your stack,
            <br className="desktop-break" /> builds your app, and brings it to
            life. You keep creating.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="marketing-button">
              Start building <ArrowRight size={17} />
            </Link>
            <a href="#how-it-works" className="hero-secondary">
              <span className="play-outline">▶</span>See how it works
            </a>
          </div>
          <div className="hero-assurances">
            <span>
              <Check size={13} />
              No Dockerfile required
            </span>
            <span>
              <Check size={13} />
              Your infrastructure
            </span>
            <span>
              <Check size={13} />
              Sensible defaults
            </span>
          </div>
          <div className="hero-preview-wrap">
            <div className="preview-caption">
              <span className="preview-dot" /> A LOOK AT YOUR WORKSPACE{" "}
              <span>Example project</span>
            </div>
            <div className="product-preview">
              <aside className="preview-sidebar">
                <div className="preview-brand">
                  <Layers3 size={17} />
                  dashpack.
                </div>
                <div className="preview-workspace">
                  <span>O</span>Orbit workspace
                  <ChevronDown size={11} />
                </div>
                <span className="preview-nav-title">WORKSPACE</span>
                <div className="preview-nav-item selected">
                  <Layers3 size={13} />
                  Overview
                </div>
                <div className="preview-nav-item">
                  <Box size={13} />
                  Applications<span>3</span>
                </div>
                <div className="preview-nav-item">
                  <Rocket size={13} />
                  Deployments
                </div>
                <div className="preview-local">
                  <span />
                  Local workspace
                </div>
              </aside>
              <div className="preview-main">
                <div className="preview-breadcrumb">
                  Orbit workspace <span>/</span> Overview
                  <div>
                    <span className="preview-online" />
                    Docker connected
                  </div>
                </div>
                <div className="preview-content">
                  <div className="preview-heading">
                    <div>
                      <small>YOUR DEPLOYMENT WORKSPACE</small>
                      <h2>Let’s ship something.</h2>
                      <p>Everything you’re building, all in one place.</p>
                    </div>
                    <span className="preview-new">+ New application</span>
                  </div>
                  <div className="preview-stats">
                    <div>
                      <span>
                        Applications <Box size={12} />
                      </span>
                      <strong>3</strong>
                      <small>Your ideas, taking shape</small>
                    </div>
                    <div>
                      <span>
                        Live now <Zap size={12} />
                      </span>
                      <strong>
                        2<span className="preview-live-dot" />
                      </strong>
                      <small>Up and running</small>
                    </div>
                    <div>
                      <span>
                        Building <Rocket size={12} />
                      </span>
                      <strong>1</strong>
                      <small>On its way to live</small>
                    </div>
                  </div>
                  <div className="preview-apps-title">
                    Applications <span>3</span>
                    <small>All systems, one workspace</small>
                  </div>
                  <div className="preview-app-table">
                    <div className="preview-table-head">
                      <span>Application</span>
                      <span>Status</span>
                      <span>Source</span>
                    </div>
                    {[
                      {
                        name: "orbit-web",
                        stack: "Next.js",
                        status: "Live",
                        icon: "N",
                        color: "dark",
                      },
                      {
                        name: "orbit-api",
                        stack: "Node.js",
                        status: "Live",
                        icon: "JS",
                        color: "sage",
                      },
                      {
                        name: "docs",
                        stack: "Astro",
                        status: "Building",
                        icon: "A",
                        color: "peach",
                      },
                    ].map((app) => (
                      <div className="preview-app-row" key={app.name}>
                        <div>
                          <span className={`preview-app-icon ${app.color}`}>
                            {app.icon}
                          </span>
                          <span>
                            <strong>{app.name}</strong>
                            <small>{app.stack}</small>
                          </span>
                        </div>
                        <span
                          className={`preview-status ${app.status.toLowerCase()}`}
                        >
                          <i />
                          {app.status}
                        </span>
                        <span className="preview-git">
                          <GitBranch size={11} />
                          main
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="deploy-toast">
              <span>
                <Check size={17} />
              </span>
              <div>
                <strong>And just like that, you’re live.</strong>
                <small>Build passed. Health check passed. Ready for you.</small>
              </div>
              <Rocket size={21} />
            </div>
          </div>
        </section>

        <section className="frameworks">
          <p>Bring the stack you love. We’ll take it from there.</p>
          <div>
            <span>
              <b className="framework-next">N</b>Next.js
            </span>
            <span>
              <b className="framework-nuxt">△</b>Nuxt
            </span>
            <span>
              <b className="framework-python">⌘</b>Python
            </span>
            <span>
              <b className="framework-node">⬡</b>Node.js
            </span>
            <span>
              <b className="framework-go">GO</b>Go
            </span>
            <span>
              <b className="framework-laravel">◇</b>Laravel
            </span>
            <span className="framework-more">+ more</span>
          </div>
        </section>

        <section className="how-section marketing-section" id="how-it-works">
          <div className="section-overline">
            <span />
            FROM IDEA TO RUNNING
          </div>
          <div className="marketing-section-heading">
            <h2>
              The shortest distance
              <br />
              between code and <em>live.</em>
            </h2>
            <p>
              Your project already knows what it needs.
              <br />
              Dashpack does the work of figuring it out.
            </p>
          </div>
          <div className="steps-grid">
            <article>
              <span className="step-number">
                01 <span>—</span>
              </span>
              <div className="step-visual source-visual">
                <Github size={31} />
                <span className="source-connector" />
                <FolderGit2 size={31} />
                <span className="source-visual-tag">Your next idea</span>
              </div>
              <h3>Bring your project.</h3>
              <p>
                Paste a public GitHub repository URL or choose a local folder.
                Give your application a name, and you’re on your way.
              </p>
            </article>
            <article>
              <span className="step-number">
                02 <span>—</span>
              </span>
              <div className="step-visual build-visual">
                <div>
                  <Code2 size={14} />
                  <span>Framework detected</span>
                  <Check size={13} />
                </div>
                <div>
                  <Layers3 size={14} />
                  <span>Dependencies installed</span>
                  <Check size={13} />
                </div>
                <div>
                  <Box size={14} />
                  <span>Container built</span>
                  <Check size={13} />
                </div>
              </div>
              <h3>Let the build happen.</h3>
              <p>
                We detect the runtime and work out the install, build and start
                commands. Follow the output as it happens.
              </p>
            </article>
            <article>
              <span className="step-number">
                03 <span>—</span>
              </span>
              <div className="step-visual live-visual">
                <div className="live-orbit">
                  <Globe2 size={28} />
                </div>
                <span>
                  <span />
                  Ready to open <ArrowUpRight size={12} />
                </span>
              </div>
              <h3>Say hello to your app.</h3>
              <p>
                Once the health check passes, open your app’s local URL. See
                logs, manage containers, and get back to building.
              </p>
            </article>
          </div>
        </section>

        <section className="platform-section marketing-section" id="platform">
          <div className="platform-copy">
            <div className="section-overline">
              <span />A LITTLE LESS FRICTION
            </div>
            <h2>
              All the moving parts.
              <br />
              <em>One calm workspace.</em>
            </h2>
            <p>
              Building an app is enough work. Running it shouldn’t become
              another project.
            </p>
            <div className="platform-benefit">
              <span>
                <Terminal size={19} />
              </span>
              <div>
                <h3>The full story, in your logs.</h3>
                <p>
                  Watch the build, check runtime output, and find what needs
                  fixing without switching between terminals.
                </p>
              </div>
            </div>
            <div className="platform-benefit">
              <span>
                <ShieldIcon />
              </span>
              <div>
                <h3>Room to try. Room to recover.</h3>
                <p>
                  New deployments run separately. If a build fails, your
                  existing app keeps serving.
                </p>
              </div>
            </div>
            <div className="platform-benefit">
              <span>
                <Server size={19} />
              </span>
              <div>
                <h3>Your machine. Your applications.</h3>
                <p>
                  Run on your Docker host, with your environment variables and
                  control over when apps start and stop.
                </p>
              </div>
            </div>
            <Link href="/signup" className="platform-link">
              Make room for your next idea <ArrowRight size={16} />
            </Link>
          </div>
          <div className="build-window">
            <div className="build-window-top">
              <div>
                <span />
                <span />
                <span />
              </div>
              <span>orbit-web · build output</span>
              <Terminal size={14} />
            </div>
            <div className="build-window-title">
              <span>
                <GitBranch size={14} />
                main
              </span>
              <span>
                <span />
                DEPLOYING
              </span>
            </div>
            <div className="build-output">
              <p>
                <span>01</span>
                <b>↳</b> Detected Next.js application
              </p>
              <p>
                <span>02</span>
                <b>↳</b> Using npm package manager
              </p>
              <p className="log-gap">
                <span>03</span>
                <i>▸</i> Installing dependencies
              </p>
              <p>
                <span>04</span>
                <em>✓</em> Dependencies installed
              </p>
              <p className="log-gap">
                <span>05</span>
                <i>▸</i> Building application
              </p>
              <p>
                <span>06</span>
                <em>✓</em> Build completed
              </p>
              <p className="log-gap">
                <span>07</span>
                <i>▸</i> Starting container
              </p>
              <p>
                <span>08</span>
                <em>✓</em> Health check passed
              </p>
              <div className="build-ready">
                <CheckCircle2 size={20} />
                <div>
                  <strong>Application ready.</strong>
                  <small>Your next chapter starts here.</small>
                </div>
                <ArrowUpRight size={18} />
              </div>
              <span className="example-label">Illustrative build output</span>
            </div>
          </div>
        </section>

        <section className="local-first">
          <div className="local-first-icon">
            <Server size={27} />
            <span>
              <LockKeyhole size={11} />
            </span>
          </div>
          <div>
            <span className="section-overline">STARTING CLOSE TO HOME</span>
            <h2>A cloud experience, on your own machine.</h2>
            <p>
              Today, Dashpack runs locally with Docker. Your app gets a local
              URL, and you stay in control.
              <br />
              Public hosting, custom domains and team workspaces are the next
              chapter.
            </p>
          </div>
          <span className="local-first-tag">
            <span />
            LOCAL-FIRST
          </span>
        </section>

        <section className="faq-section marketing-section" id="faq">
          <div>
            <div className="section-overline">
              <span />
              GOOD QUESTIONS
            </div>
            <h2>
              A few things
              <br />
              you might be <em>wondering.</em>
            </h2>
            <p>Less mystery. More getting started.</p>
          </div>
          <div className="faq-list">
            {[
              {
                q: "Do I need to write a Dockerfile?",
                a: "Usually, no. Dashpack detects supported languages and frameworks, installs dependencies and generates the build plan. You can override commands when your project needs something different.",
              },
              {
                q: "What can I deploy?",
                a: "Web apps, APIs and static sites using supported stacks, including Next.js, Node.js, Python, Go, PHP and more. For GitHub imports, use a public repository with your application at its root.",
              },
              {
                q: "Where will my application run?",
                a: "On the machine running Dashpack, inside a Docker container. This version assigns a local URL on 127.0.0.1. Start Docker Desktop, open your workspace, and use the setup button if the build engine is not running yet.",
              },
              {
                q: "What happens when a deployment fails?",
                a: "You can inspect the build output in your workspace. Failed startup candidates are removed while previous deployments remain running. Each successful deployment currently has its own container and URL.",
              },
              {
                q: "Can I add environment variables?",
                a: "Yes. Open Advanced settings when creating an application and add one KEY=value per line. You can also set the app’s port and health-check path there.",
              },
            ].map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <PlusIcon />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="closing-cta">
          <div className="cta-stars" aria-hidden="true">
            ✳
          </div>
          <span className="section-overline">
            GOOD IDEAS DESERVE TO BE LIVE
          </span>
          <h2>
            Less configuring.
            <br />
            <em>More creating.</em>
          </h2>
          <p>Your next project is ready for a place to run.</p>
          <Link href="/signup" className="marketing-button">
            Let’s ship something <ArrowRight size={16} />
          </Link>
          <small>Bring your code. We’ll meet you there.</small>
        </section>
      </main>
      <footer className="marketing-footer">
        <div>
          <Link href="/" className="marketing-brand">
            <Layers3 size={21} />
            dashpack<span>.</span>
          </Link>
          <p>A small push. A big possibility.</p>
        </div>
        <div className="footer-links">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/login">
            Your workspace <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Dashpack</span>
          <span>
            <span className="announcement-dot" />
            Built for what’s next.
          </span>
        </div>
      </footer>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
