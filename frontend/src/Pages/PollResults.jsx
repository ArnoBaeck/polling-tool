import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API } from "../lib/api";
import { usePollSocket } from "../Hooks/usePollSocket";
import "../Styles/page-results.css";

export default function PollResults() {
  const { pollId } = useParams();
  const [pollTitle, setPollTitle] = useState("");
  const [series, setSeries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // initial fetch of title and results
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await fetch(`${API}/polls/${pollId}`);
        const pd = await p.json();
        if (!p.ok) throw new Error(pd?.error || `HTTP ${p.status}`);
        if (active) setPollTitle(pd?.poll?.title || "");

        const r = await fetch(`${API}/polls/${pollId}/results`);
        const rd = await r.json();
        if (!r.ok) throw new Error(rd?.error || `HTTP ${r.status}`);
        if (active) setSeries(rd.results || []);
      } catch (e) {
        if (active) setError(e.message || "Kon resultaten niet laden");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [pollId]);

  // live updates
  usePollSocket(pollId, setSeries);

  if (loading) return <main className="results"><p>Laden…</p></main>;
  if (error)   return <main className="results"><p className="form__error">{error}</p></main>;

  const total = series.reduce((a, b) => a + (b.count || 0), 0) || 1;

  return (
    <main className="results">
      <section className="results__card">
        <h1>Resultaten: {pollTitle}</h1>

        <ul className="results__bars">
          {series.map((s) => {
            const pct = Math.round(((s.count || 0) / total) * 100);
            return (
              <li key={s.optionId} className="results__bar">
                <div className="results__bar-label">
                  <span>{s.label}</span>
                  <span className="results__bar-meta">{s.count ?? 0} • {pct}%</span>
                </div>
                <div className="results__bar-track">
                  <div className="results__bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="results__actions">
          <Link className="btn--ghost" to={`/vote/${pollId}`}>Terug naar stemmen</Link>
        </div>
      </section>
    </main>
  );
}