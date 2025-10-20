import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { usePollSocket } from "../Hooks/usePollSocket";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function VotePoll() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [series, setSeries] = useState([]);
  const [error, setError] = useState("");

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

  async function vote(optionId) {
    try {
      setError("");
      const res = await fetch(`${API}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poll_id: pollId,
          option_id: optionId,
          session_id: sessionId
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
    } catch (e) {
      setError(e.message || "Stemmen mislukt");
    }
  }

  if (!pollId) return <p>Geen pollId in de URL.</p>;
  if (!poll) return <p>Laden…</p>;

  const total = series.reduce((a, b) => a + (b.count || 0), 0) || 1;

  return (
    <div>
      <h1>{poll.title} {poll.status === "live" ? "• LIVE" : ""}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {series.map((s) => {
          const pct = Math.round(((s.count || 0) / total) * 100);
          return (
            <li key={s.optionId}>
              <button
                onClick={() => vote(s.optionId)}
                disabled={poll.status !== "live"}
              >
                {s.label}
              </button>
              <span> — {s.count ?? 0} • {pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}