import { useCallback, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Footer from "./components/layout/Footer.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import SiteIntro from "./components/layout/SiteIntro.jsx";
import Contacts from "./pages/Contacts.jsx";
import Home from "./pages/Home.jsx";
import { Privacy, Terms } from "./pages/Legal.jsx";
import Matches from "./pages/Matches.jsx";
import News from "./pages/News.jsx";
import NotFound from "./pages/NotFound.jsx";
import Partners from "./pages/Partners.jsx";
import Shop from "./pages/Shop.jsx";
import Team from "./pages/Team.jsx";

import "./App.css";

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const location = useLocation();
  const initialViewWasPositionedRef = useRef(false);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const showRosterAsInitialView = useCallback(() => {
    if (initialViewWasPositionedRef.current || location.pathname !== "/") {
      return;
    }

    const rosterSection = document.getElementById("roster");
    if (!rosterSection) {
      return;
    }

    initialViewWasPositionedRef.current = true;

    const navbarHeight =
      document.querySelector(".navbar")?.getBoundingClientRect().height ?? 0;
    const rosterTop =
      window.scrollY + rosterSection.getBoundingClientRect().top - navbarHeight;

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

  return (
    <div className={`app-shell${showIntro ? " app-shell-loading" : " app-shell-ready"}`}>
      {showIntro && <SiteIntro onFinish={closeIntro} />}

      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/news" element={<News />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
