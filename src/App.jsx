import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "./auth/AuthContext.jsx";
import AdminRoute from "./auth/AdminRoute.jsx";
import OwnerRoute from "./auth/OwnerRoute.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import RosterManagerRoute from "./auth/RosterManagerRoute.jsx";
import PlayerRoute from "./auth/PlayerRoute.jsx";
import StaffRoute from "./auth/StaffRoute.jsx";
import Footer from "./components/layout/Footer.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import SiteIntro from "./components/layout/SiteIntro.jsx";
import SeoManager from "./components/SeoManager.jsx";
import FloatingSupportButton from "./components/support/FloatingSupportButton.jsx";
import Account from "./pages/Account.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminHighlights from "./pages/AdminHighlights.jsx";
import ExtensionMediaAdmin from "./pages/ExtensionMediaAdmin.jsx";
import AdminNews from "./pages/AdminNews.jsx";
import AIPrivacy from "./pages/AIPrivacy.jsx";
import BlockedAccount from "./pages/BlockedAccount.jsx";
import BotDashboard from "./pages/BotDashboard.jsx";
import Contacts from "./pages/Contacts.jsx";
import DiscordBot from "./pages/DiscordBot.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import FounderDashboard from "./pages/FounderDashboard.jsx";
import History from "./pages/History.jsx";
import Highlights from "./pages/Highlights.jsx";
import Home from "./pages/Home.jsx";
import { Privacy, Terms } from "./pages/Legal.jsx";
import FaceitPrivacy from "./pages/FaceitPrivacy.jsx";
import Login from "./pages/Login.jsx";
import Matches from "./pages/Matches.jsx";
import Tournaments from "./pages/Tournaments.jsx";
import TournamentDashboard from "./pages/TournamentDashboard.jsx";
import TournamentPublic from "./pages/TournamentPublic.jsx";
import TournamentPreview from "./pages/TournamentPreview.jsx";
import News from "./pages/News.jsx";
import NotFound from "./pages/NotFound.jsx";
import OwnerDiscord from "./pages/OwnerDiscord.jsx";
import OwnerRoster from "./pages/OwnerRoster.jsx";
import OwnerShop from "./pages/OwnerShop.jsx";
import OwnerUsers from "./pages/OwnerUsers.jsx";
import PaddleCheckout from "./pages/PaddleCheckout.jsx";
import Partners from "./pages/Partners.jsx";
import PlayerTactics from "./pages/PlayerTactics.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Shop from "./pages/Shop.jsx";
import SharedTactic from "./pages/SharedTactic.jsx";
import Support from "./pages/Support.jsx";
import Team from "./pages/Team.jsx";
import UserSearch from "./pages/UserSearch.jsx";

import "./App.css";
import "./styles/Typography.css";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tournamentTransition, setTournamentTransition] = useState(false);
  const tournamentTransitionTimer = useRef(null);
  const { user, loading, isBlocked } = useAuth();

  const [showIntro, setShowIntro] = useState(location.pathname === "/");
  const initialViewWasPositionedRef = useRef(false);
  const introIsActive = showIntro && location.pathname === "/";

  useEffect(() => {
    function handleTournamentLink(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname !== "/tournaments" || location.pathname === "/tournaments") return;
      event.preventDefault();
      event.stopPropagation();
      if (tournamentTransitionTimer.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        navigate(destination.pathname + destination.search + destination.hash);
        return;
      }
      setTournamentTransition(true);
      tournamentTransitionTimer.current = window.setTimeout(() => {
        tournamentTransitionTimer.current = null;
        navigate(destination.pathname + destination.search + destination.hash);
        setTournamentTransition(false);
      }, 1550);
    }
    document.addEventListener("click", handleTournamentLink, true);
    return () => {
      document.removeEventListener("click", handleTournamentLink, true);
      window.clearTimeout(tournamentTransitionTimer.current);
      tournamentTransitionTimer.current = null;
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (!introIsActive && location.pathname !== "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname, introIsActive]);

  const showRosterAsInitialView = useCallback(() => {
    if (initialViewWasPositionedRef.current || location.pathname !== "/") {
      return;
    }

    const rosterSection = document.getElementById("roster");
    if (!rosterSection) return;

    initialViewWasPositionedRef.current = true;

    const navbarHeight =
      document.querySelector(".navbar")?.getBoundingClientRect().height ?? 0;

    const rosterTop =
      window.scrollY +
      rosterSection.getBoundingClientRect().top -
      navbarHeight;

    window.scrollTo({
      top: Math.max(0, rosterTop),
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  const closeIntro = useCallback(() => {
    setShowIntro(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(showRosterAsInitialView);
    });
  }, [showRosterAsInitialView]);

  if (!loading && user && isBlocked && location.pathname !== "/blocked") {
    return <Navigate to="/blocked" replace />;
  }

  return (
    <div
      className={`app-shell${
        introIsActive ? " app-shell-loading" : " app-shell-ready"
      }`}
    >
      <SeoManager />
      {tournamentTransition && (
        <div className="iste-bracket-transition" role="status" aria-label="Открывается турнирная сетка">
          <div className="iste-bracket-transition__rounds" aria-hidden="true">
            <div className="iste-bracket-transition__round"><span>ISTe</span><span>TEAM ALPHA</span><span>TEAM BRAVO</span><span>TEAM CHARLIE</span></div>
            <div className="iste-bracket-transition__round iste-bracket-transition__semis"><span>SEMI FINAL</span><span>ISTe</span></div>
            <div className="iste-bracket-transition__round iste-bracket-transition__winner"><span>WINNER</span><strong>ISTe</strong></div>
          </div>
          <div className="iste-bracket-transition__bullet-flight" aria-hidden="true">
            <div className="iste-bracket-transition__trail" />
            <div className="iste-bracket-transition__bullet">
              <svg viewBox="0 0 180 56" fill="none">
                <defs>
                  <linearGradient id="iste-cartridge" x1="0" y1="0" x2="0.85" y2="1">
                    <stop offset="0" stopColor="#faf4df"/>
                    <stop offset=".26" stopColor="#bba67c"/>
                    <stop offset=".57" stopColor="#554c3d"/>
                    <stop offset=".8" stopColor="#e0c599"/>
                    <stop offset="1" stopColor="#524535"/>
                  </linearGradient>
                  <linearGradient id="iste-tip" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#dfdfdc"/><stop offset=".55" stopColor="#848483"/><stop offset="1" stopColor="#e9e9e7"/>
                  </linearGradient>
                </defs>
                <path d="M5 9h108l48 19-48 19H5z" fill="url(#iste-cartridge)" stroke="#eee1bf" strokeWidth="1.4"/>
                <path d="M113 9 161 28 113 47z" fill="url(#iste-tip)"/>
                <path d="M17 9v38M109 9v38" stroke="#554533" strokeWidth="2"/>
                <path d="M5 14h108" stroke="#fff8e1" strokeOpacity=".5" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>
          <p className="iste-bracket-transition__caption">ISTe <span>TOURNAMENTS</span></p>
        </div>
      )}

      {introIsActive && <SiteIntro onFinish={closeIntro} />}

      <Navbar />

      {!introIsActive ? <FloatingSupportButton /> : null}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/owner/tournaments-preview" element={<OwnerRoute><TournamentPreview /></OwnerRoute>} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:slug" element={<TournamentPublic />} />
          <Route path="/tournaments/create" element={<OwnerRoute><Tournaments create /></OwnerRoute>} />
          <Route path="/account/tournaments" element={<OwnerRoute><TournamentDashboard /></OwnerRoute>} />
          <Route path="/news" element={<News />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/discord" element={<DiscordBot />} />
          <Route path="/history" element={<History />} />
          <Route path="/highlights" element={<Highlights />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/support" element={<Support />} />
          <Route path="/tactics/share/:token" element={<SharedTactic />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/privacy/faceit" element={<FaceitPrivacy />} />
          <Route path="/privacy/ai" element={<AIPrivacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/blocked" element={<BlockedAccount />} />

          <Route
            path="/bot/dashboard"
            element={
              <ProtectedRoute>
                <BotDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserSearch />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/highlights"
            element={
              <AdminRoute>
                <AdminHighlights />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/news"
            element={
              <StaffRoute>
                <AdminNews />
              </StaffRoute>
            }
          />

          <Route
            path="/admin/extension-media"
            element={
              <OwnerRoute>
                <ExtensionMediaAdmin />
              </OwnerRoute>
            }
          />

          <Route
            path="/founder"
            element={
              <OwnerRoute>
                <FounderDashboard />
              </OwnerRoute>
            }
          />

          <Route
            path="/owner/users"
            element={
              <AdminRoute>
                <OwnerUsers />
              </AdminRoute>
            }
          />

          <Route
            path="/owner/shop"
            element={
              <AdminRoute>
                <OwnerShop />
              </AdminRoute>
            }
          />

          <Route
            path="/owner/roster"
            element={
              <RosterManagerRoute>
                <OwnerRoster />
              </RosterManagerRoute>
            }
          />

          <Route
            path="/control/roster"
            element={
              <RosterManagerRoute>
                <OwnerRoster />
              </RosterManagerRoute>
            }
          />

          <Route
            path="/player/tactics"
            element={
              <PlayerRoute>
                <PlayerTactics />
              </PlayerRoute>
            }
          />

          <Route
            path="/owner/discord"
            element={
              <AdminRoute>
                <OwnerDiscord />
              </AdminRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
