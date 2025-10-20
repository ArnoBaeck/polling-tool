import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/page-home.css";

export default function Home() {
  const [pollId, setPollId] = useState("");
  const navigate = useNavigate();

  function goDetails(e) {
    e.preventDefault();
    if (pollId.trim()) navigate(`/poll/${pollId.trim()}`);
  }
  function goVote(e) {
    e.preventDefault();
    if (pollId.trim()) navigate(`/vote/${pollId.trim()}`);
  }
  function goResults(e) {
    e.preventDefault();
    if (pollId.trim()) navigate(`/results/${pollId.trim()}`);
  }

  return (
    <main className="home">
      <section className="home__card">
        <h1>Join/maak poll</h1>
        <p>Voer een bestaand poll id in en navigeer.</p>
        <form className="home__form">
          <input
            className="home__input"
            type="text"
            value={pollId}
            onChange={(e) => setPollId(e.target.value)}
            placeholder="ObjectId, bijv. 652c9c0d0f0f0f0f0f0f0f0f"
          />
          <div className="home__actions">
            <button onClick={goDetails}>Poll details</button>
            <button onClick={goVote}>Stemmen</button>
            <button onClick={goResults}>Resultaten</button>
          </div>
        </form>
        <p className="home__hint">
          Of <a href="/create">maak een nieuwe poll</a> en wordt automatisch doorgestuurd naar stemmen.
        </p>
      </section>
    </main>
  );
}