import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useCardStats } from "./hooks/useCardStats";
import Home from "./pages/Home";
import CreateCard from "./pages/CreateCard";
import EditCard from "./pages/EditCard";
import PlayCard from "./pages/PlayCard";
import Profile from "./pages/Profile";
import "./App.css";

function NavigationContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stats } = useCardStats();

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    // If we're already on the target page, force a reload by navigating with a new timestamp
    if (location.pathname === path) {
      e.preventDefault();
      navigate(path, { state: { reload: Date.now() } });
    }
  };

  // Allow create link to work even if stats haven't loaded or failed
  const isCreateDisabled = stats?.canCreate === false;

  return (
    <div className="app">
      <nav className="navbar">
        <Link
          to="/"
          className="nav-brand"
          onClick={(e) => handleNavClick(e, "/")}
        >
          Bingo Builder
        </Link>
        <div className="nav-links">
          <Link to="/" onClick={(e) => handleNavClick(e, "/")}>
            Home
          </Link>
          <Link
            to="/create"
            className={isCreateDisabled ? "disabled-link" : ""}
            onClick={(e) => {
              if (isCreateDisabled) {
                e.preventDefault();
                alert(
                  `Maximum unpublished cards limit reached (${stats.maxUnpublished}/${stats.maxUnpublished}). Please publish or delete existing cards.`,
                );
              } else {
                handleNavClick(e, "/create");
              }
            }}
            title={
              isCreateDisabled
                ? `Limit reached: ${stats.unpublished}/${stats.maxUnpublished} unpublished cards`
                : undefined
            }
          >
            Create Card
          </Link>
          <Link to="/profile" onClick={(e) => handleNavClick(e, "/profile")}>
            Profile
          </Link>
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
  );
}

function App() {
  return (
    <Router>
      <NavigationContent />
    </Router>
  );
}

export default App;
