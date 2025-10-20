// REACT IMPORTS
import { Link, NavLink } from "react-router-dom";

// STYLE IMPORTS
import "../Styles/navbar.css";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link className="nav__brand" to="/">Polling Tool</Link>
        <nav className="nav__links">
          <NavLink to="/" className="nav__link">Home</NavLink>
          <NavLink to="/create" className="nav__link">Create</NavLink>
        </nav>
      </div>
    </header>
  );
}