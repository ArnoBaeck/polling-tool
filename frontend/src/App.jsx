// REACT IMPORTS
import { Routes, Route } from "react-router-dom";

// COMPONENT IMPORTS
import NavBar from "./Components/NavBar";

// PAGE IMPORTS
import Home from "./Pages/Home";
import CreatePoll from "./Pages/CreatePoll";
import PollDetails from "./Pages/PollDetails";
import VotePoll from "./Pages/VotePoll";
import PollResults from "./Pages/PollResults";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/poll/:pollId" element={<PollDetails />} />
        <Route path="/vote/:pollId" element={<VotePoll />} />
        <Route path="/results/:pollId" element={<PollResults />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}