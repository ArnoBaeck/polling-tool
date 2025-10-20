import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import "../Styles/page-create.css";

export default function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const clean = options.map(o => o.trim()).filter(Boolean);
    const validDuration =
      duration === "" || (!Number.isNaN(Number(duration)) && Number(duration) >= 0);
    return title.trim().length > 0 && clean.length >= 2 && validDuration && !submitting;
  }, [title, options, submitting, duration]);

  function updateOption(index, value) {
    setOptions(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }
  function addOption() { setOptions(prev => [...prev, ""]); }
  function removeOption(index) {
    setOptions(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next.length ? next : [""];
    });
  }

  function setPreset(min) {
    setDuration(String(min));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (!title.trim() || cleanOptions.length < 2) {
      setError("Vul een titel in en minstens 2 opties.");
      return;
    }

    const durationNumber =
      duration === "" ? null : Math.max(0, Number.parseInt(duration, 10) || 0);

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          options: cleanOptions,
          duration: durationNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (!data.poll_id) throw new Error("poll_id ontbreekt in server response.");
      navigate(`/vote/${data.poll_id}`);
    } catch (err) {
      setError(err.message || "Er ging iets mis bij het aanmaken.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="create">
      <form className="create__form" onSubmit={handleSubmit}>
        <h1>Nieuwe Poll</h1>

        <label className="create__label">
          <span>Titel</span>
          <input
            className="create__input"
            type="text"
            placeholder="Bijv. Wat eten we vanavond?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <div className="create__options">
          <h3>Opties</h3>
          {options.map((opt, i) => (
            <div className="create__option-row" key={i}>
              <input
                className="create__input"
                type="text"
                placeholder={`Optie ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              <button type="button" onClick={() => removeOption(i)} className="btn--ghost">
                Verwijderen
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption} className="btn--ghost">
            + Optie toevoegen
          </button>
        </div>

        <fieldset className="create__duration">
          <legend>Eindtijd</legend>
          <div className="create__duration-row">
            <label className="create__label create__label--inline">
              <span>Duur (minuten)</span>
              <input
                className="create__input create__input--sm"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="bijv. 15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>
            <div className="create__presets">
              <button type="button" className="btn--ghost" onClick={() => setPreset(5)}>5</button>
              <button type="button" className="btn--ghost" onClick={() => setPreset(15)}>15</button>
              <button type="button" className="btn--ghost" onClick={() => setPreset(30)}>30</button>
              <button type="button" className="btn--ghost" onClick={() => setPreset(60)}>60</button>
              <button type="button" className="btn--ghost" onClick={() => setDuration("")}>Geen eindtijd</button>
            </div>
          </div>
        </fieldset>

        {error && <p className="form__error">{error}</p>}

        <button className="btn--primary" type="submit" disabled={!canSubmit}>
          {submitting ? "Aanmaken..." : "Poll aanmaken"}
        </button>
      </form>
    </main>
  );
}