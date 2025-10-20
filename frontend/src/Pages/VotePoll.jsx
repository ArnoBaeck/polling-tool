import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { usePollSocket } from "../Hooks/usePollSocket";
import { API } from "../lib/api";
import "../Styles/page-vote.css";

function formatRemaining(ms) {
  if (ms == null) return null;
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VotePoll() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [series, setSeries] = useState([]);
  const [error, setError] = useState("");
  const [remainingMs, setRemainingMs] = useState(null);

  const sessionId = useMemo(() => {
    let id = localStorage.getItem("session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("session_id", id);
    }
    return id;
  }, []);

  useEffect(() => {
    if (!pollId) return;
    (async () => {
      setError("");
      try {
        const pRes = await fetch(`${API}/polls/${pollId}`);
        const pData = await pRes.json();
        if (!pRes.ok) throw new Error(pData?.error || "Kon poll niet laden");
        setPoll(pData.poll);

        const rRes = await fetch(`${API}/polls/${pollId}/results`);
        const rData = await rRes.json();
        if (!rRes.ok) throw new Error(rData?.error || "Kon resultaten niet laden");
        setSeries(rData.results || []);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [pollId]);

  usePollSocket(pollId, setSeries);

  useEffect(() => {
    if (!poll?.expires_at) { setRemainingMs(null); return; }

    const target = new Date(poll.expires_at).getTime();
    function tick() {
      const now = Date.now();
      const ms = target - now;
      setRemainingMs(ms);
      if (ms <= 0 && poll.status === "live") {
        setPoll(prev => prev ? { ...prev, status: "closed" } : prev);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [poll?.expires_at, poll?.status]);

  async function vote(optionId) {
    try {
      setError("");
      const res = await fetch(`${API}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId, session_id: sessionId }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
    } catch (e) {
      setError(e.message || "Stemmen mislukt");
    }
  }

  if (!pollId) return <main className="vote"><p>Geen pollId in de URL.</p></main>;
  if (!poll)   return <main className="vote"><p>Laden…</p></main>;

  const total = series.reduce((a, b) => a + (b.count || 0), 0) || 1;
  const countdown = formatRemaining(remainingMs);
  const isLive = poll.status === "live";

  function copyCode() {
    navigator.clipboard.writeText(poll.id);
  }

  return (
    <main className="vote">
      <section className="vote__card">
        <div className="vote__header">
          <h1>{poll.title} {isLive ? "• LIVE" : "• CLOSED"}</h1>
          {poll.expires_at && (
            <p className="vote__timer" aria-live="polite">
              Eindigt: {new Date(poll.expires_at).toLocaleString()}{" "}
              {isLive && countdown && <span className="vote__countdown">({countdown})</span>}
            </p>
          )}
        </div>

        <p className="vote__invite">
          Invite code: <span className="vote__code">{poll.id}</span>
          <button className="btn--primary" onClick={copyCode}>Kopieer</button>
        </p>

        {error && <p className="form__error">{error}</p>}

        <ul className="vote__options">
          {series.map((s) => {
            const pct = Math.round(((s.count || 0) / total) * 100);
            return (
              <li key={s.optionId} className="vote__row">
                <button
                  className="btn--primary"
                  onClick={() => vote(s.optionId)}
                  disabled={!isLive}
                  aria-disabled={!isLive}
                  title={isLive ? "Stem op deze optie" : "Poll is gesloten"}
                >
                  {s.label}
                </button>
                <span className="vote__meta">{s.count ?? 0} • {pct}%</span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}