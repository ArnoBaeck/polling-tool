import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function CreatePoll() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const clean = options.map(o => o.trim()).filter(Boolean);
    return title.trim().length > 0 && clean.length >= 2 && !submitting;
  }, [title, options, submitting]);

  function updateOption(index, value) {
    setOptions(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addOption() {
    setOptions(prev => [...prev, ""]);
  }

  function removeOption(index) {
    setOptions(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next.length ? next : [""];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (!title.trim() || cleanOptions.length < 2) {
      setError("Vul een titel in en minstens 2 opties.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), options: cleanOptions }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      const data = JSON.parse(text || "{}");
      if (!data.poll_id) throw new Error("poll_id ontbreekt in server response.");

      navigate(`/vote/${data.poll_id}`);
    } catch (err) {
      setError(err.message || "Er ging iets mis bij het aanmaken.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Nieuwe Poll</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Titel:
          <input
            type="text"
            placeholder="Bijv. Wat eten we vanavond?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <h3>Opties:</h3>
        {options.map((opt, i) => (
          <div key={i}>
            <input
              type="text"
              placeholder={`Optie ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
            <button type="button" onClick={() => removeOption(i)}>
              Verwijderen
            </button>
          </div>
        ))}

        <button type="button" onClick={addOption}>
          + Optie toevoegen
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={!canSubmit}>
          {submitting ? "Aanmaken..." : "Poll aanmaken"}
        </button>
      </form>
    </div>
  );
}