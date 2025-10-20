import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API } from "../lib/api";
import "../Styles/page-details.css";

export default function PollDetails() {
  const { pollId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [data, setData]     = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/polls/${pollId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e.message || "Kon poll niet laden");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [pollId]);

  if (loading) return <main className="details"><p>Laden…</p></main>;
  if (error)   return <main className="details"><p className="form__error">{error}</p></main>;
  if (!data)   return null;

  const { poll, options } = data;

  return (
    <main className="details">
      <section className="details__card">
        <h1>{poll.title}</h1>
        <p>Status: <strong>{poll.status}</strong></p>

        <h3>Opties</h3>
        <ul className="details__list">
          {options.map(o => (
            <li key={o.id}>{o.label} <span className="muted">({o.id})</span></li>
          ))}
        </ul>

        <div className="details__actions">
          <Link className="btn--primary" to={`/vote/${poll.id}`}>Naar stemmen</Link>
          <Link className="btn--ghost" to={`/results/${poll.id}`}>Bekijk resultaten</Link>
        </div>
      </section>
    </main>
  );
}