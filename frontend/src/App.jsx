// REACT IMPORTS
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// PAGES IMPORTS
import Home from "./Pages/Home";
import CreatePoll from "./Pages/CreatePoll";
import VotePoll from "./Pages/VotePoll";
import PollResults from "./Pages/PollResults";

// COMPONENTS IMPORTS
import Navbar from "./Components/Navbar";

export default function App() {
	return (
		<Router>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/create" element={<CreatePoll />} />

				<Route path="/vote/:pollId" element={<VotePoll />} />
				<Route path="/results/:pollId" element={<PollResults />} />	

				<Route path="*" element={<div>404 – Page not found</div>} />
			</Routes>
		</Router>
	);
}
