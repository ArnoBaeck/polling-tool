// REACT IMPORTS
import { Link } from "react-router-dom";

// STYLES IMPORTS
import "../Styles/Navbar.css";

export default function Navbar() {
	return (
		<nav>
			<Link to="/">Home</Link>
			<Link to="/create">Create Poll</Link>
		</nav>
	);
}
