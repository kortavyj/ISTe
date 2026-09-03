import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "./auth/AuthContext.jsx";
import OwnerRoute from "./auth/OwnerRoute.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import StaffRoute from "./auth/StaffRoute.jsx";
import Footer from "./components/layout/Footer.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import SiteIntro from "./components/layout/SiteIntro.jsx";
import SeoManager from "./components/SeoManager.jsx";
import Account from "./pages/Account.jsx";
import AdminNews from "./pages/AdminNews.jsx";
import BlockedAccount from "./pages/BlockedAccount.jsx";
import Contacts from "./pages/Contacts.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import History from "./pages/History.jsx";
import Home from "./pages/Home.jsx";
import { Privacy, Terms } from "./pages/Legal.jsx";
import Login from "./pages/Login.jsx";
import Matches from "./pages/Matches.jsx";
import News from "./pages/News.jsx";
import NotFound from "./pages/NotFound.jsx";
import OwnerShop from "./pages/OwnerShop.jsx";
import OwnerUsers from "./pages/OwnerUsers.jsx";
import Partners from "./pages/Partners.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Shop from "./pages/Shop.jsx";
import Team from "./pages/Team.jsx";
import UserSearch from "./pages/UserSearch.jsx";
import OwnerDiscord from "./pages/OwnerDiscord.jsx";

import "./App.css";
import "./styles/Typography.css";

export default function App() {
  const location = useLocation();

  const {
    user,
    loading,
    isBlocked,
  } = useAuth();

  const [showIntro, setShowIntro] = useState(
    location.pathname === "/",
  );

  const initialViewWasPositionedRef =
    useRef(false);

  const introIsActive =
    showIntro &&
    location.pathname === "/";

  useEffect(() => {
    const previousScrollRestoration =
      window.history.scrollRestoration;

    window.history.scrollRestoration =
      "manual";

    return () => {
      window.history.scrollRestoration =
        previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (
      !introIsActive &&
      location.pathname !== "/"
    ) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }
  }, [
    location.pathname,
    introIsActive,
  ]);

  const showRosterAsInitialView =
    useCallback(() => {
      if (
        initialViewWasPositionedRef.current ||
        location.pathname !== "/"
      ) {
        return;
      }

      const rosterSection =
        document.getElementById(
          "roster",
        );

      if (!rosterSection) {
        return;
      }

      initialViewWasPositionedRef.current =
        true;

      const navbarHeight =
        document
          .querySelector(".navbar")
          ?.getBoundingClientRect()
          .height ?? 0;

      const rosterTop =
        window.scrollY +
        rosterSection
          .getBoundingClientRect()
          .top -
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
      window.requestAnimationFrame(
        showRosterAsInitialView,
      );
    });
  }, [showRosterAsInitialView]);

  if (
    !loading &&
    user &&
    isBlocked &&
    location.pathname !== "/blocked"
  ) {
    return (
      <Navigate
        to="/blocked"
        replace
      />
    );
  }

  return (
    <div
      className={`app-shell${
        introIsActive
          ? " app-shell-loading"
          : " app-shell-ready"
      }`}
    >
      <SeoManager />

      {introIsActive && (
        <SiteIntro
          onFinish={closeIntro}
        />
      )}

      <Navbar />

      <main>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/team"
            element={<Team />}
          />

          <Route
            path="/matches"
            element={<Matches />}
          />

          <Route
            path="/news"
            element={<News />}
          />

          <Route
            path="/partners"
            element={<Partners />}
          />

          <Route
            path="/history"
            element={<History />}
          />

          <Route
            path="/contacts"
            element={<Contacts />}
          />

          <Route
            path="/shop"
            element={<Shop />}
          />

          <Route
            path="/privacy"
            element={<Privacy />}
          />

          <Route
            path="/terms"
            element={<Terms />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/blocked"
            element={<BlockedAccount />}
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
            path="/admin/news"
            element={
              <StaffRoute>
                <AdminNews />
              </StaffRoute>
            }
          />

          <Route
            path="/owner/users"
            element={
              <OwnerRoute>
                <OwnerUsers />
              </OwnerRoute>
            }
          />

          <Route
            path="/owner/shop"
            element={
              <OwnerRoute>
                <OwnerShop />
              </OwnerRoute>
            }
          />
<Route
  path="/owner/shop"
  element={
    <OwnerRoute>
      <OwnerShop />
    </OwnerRoute>
  }
/>

<Route
  path="/owner/discord"
  element={
    <OwnerRoute>
      <OwnerDiscord />
    </OwnerRoute>
  }
/>

<Route
  path="*"
  element={<NotFound />}
/>
          
          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
