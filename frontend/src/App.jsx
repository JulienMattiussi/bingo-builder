import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreateCard from "./pages/CreateCard";
import EditCard from "./pages/EditCard";
import PlayCard from "./pages/PlayCard";
import Profile from "./pages/Profile";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="nav-brand">
            Bingo Builder
          </Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/create">Create Card</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateCard />} />
            <Route path="/edit/:id" element={<EditCard />} />
            <Route path="/play/:id" element={<PlayCard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
