import { Link } from "react-router-dom";
import { modules } from "../modules/registry.js";

export default function Home() {
  return (
    <section className="home-grid">
      {modules.map((mod) =>
        mod.enabled ? (
          <Link key={mod.id} className="home-card" to={mod.path}>
            <h2>{mod.title}</h2>
            <p>{mod.blurb}</p>
          </Link>
        ) : (
          <div key={mod.id} className="home-card is-soon">
            <h2>{mod.title}</h2>
            <p>{mod.blurb}</p>
          </div>
        )
      )}
    </section>
  );
}
