import { COLLEGE_NAME } from "../constants/site.js";
import ThemeToggle from "./ThemeToggle.jsx";

const SPARKS = Array.from({ length: 22 }, (_, i) => i);

function LandingBackdrop() {
  return (
    <div className="landing-sky" aria-hidden="true">
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
      <span className="landing-scan" />
      {SPARKS.map((i) => (
        <span key={i} className={`spark spark-${i + 1}`} />
      ))}
    </div>
  );
}

function CollegeEmblem() {
  return (
    <div className="landing-logo-wrap">
      <span className="logo-burst" aria-hidden="true" />
      <span className="logo-ring logo-ring-a" aria-hidden="true" />
      <span className="logo-ring logo-ring-b" aria-hidden="true" />
      <span className="logo-orbit" aria-hidden="true">
        <span className="orbit-dot" />
      </span>
      <span className="logo-orbit logo-orbit-2" aria-hidden="true">
        <span className="orbit-dot" />
      </span>
      <div className="landing-logo">
        <img
          src="/brand/mce-logo.webp"
          alt={`${COLLEGE_NAME} emblem`}
          width="480"
          height="480"
        />
        <span className="logo-shine" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <section className="landing" aria-label={COLLEGE_NAME}>
      <LandingBackdrop />
      <div className="landing-chrome">
        <ThemeToggle />
      </div>
      <div className="landing-stage">
        <CollegeEmblem />
        <p className="landing-kicker">Government of Bihar · Est. 1980</p>
        <h1 className="landing-name">
          <span>Motihari College</span>
          <span>of Engineering</span>
        </h1>
        <p className="landing-hindi">मोतिहारी अभियंत्रण महाविद्यालय</p>
        <p className="landing-place">Motihari · East Champaran · Bihar</p>
        <div className="landing-notice" role="status">
          <span className="notice-dot" aria-hidden="true" />
          <span className="notice-label">Under development</span>
        </div>
        <p className="landing-copy">
          Un-Official campus site for {COLLEGE_NAME}. Pages and tools are being
          assembled — this space will open when they are ready.
        </p>
      </div>
    </section>
  );
}
