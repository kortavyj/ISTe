import { useEffect, useMemo, useState } from "react";
import { ACADEMY_PLAYERS } from "../data/academyRoster.js";

export default function useAcademyRoster(enabled = true) {
  const [live, setLive] = useState([]);
  const [error, setError] = useState(false);
  const [portraits, setPortraits] = useState({});
  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false;
    const load = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/academy-faceit-stats.json?time=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("FACEIT unavailable");
        const data = await response.json();
        if (!disposed) { setLive(Array.isArray(data.players) ? data.players : []); setError(false); }
      } catch {
        if (!disposed) setError(true);
      }
    };
    const loadPortraits = async () => {
      try {
        const res = await fetch("/api/academy-portraits", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!disposed && json.ok && json.portraits) setPortraits(json.portraits);
        }
      } catch { /* Keep fallback portraits. */ }
    };
    void loadPortraits();
    void load();
    const interval = window.setInterval(() => { void load(); void loadPortraits(); }, 300000);
    return () => { disposed = true; window.clearInterval(interval); };
  }, [enabled]);
  const players = useMemo(() => {
    const byNick = new Map(live.map((p) => [String(p.nickname).toLowerCase(), p]));
    return ACADEMY_PLAYERS.map((p) => ({
      ...p, ...(byNick.get(p.nickname.toLowerCase()) || {}),
      isCaptain: p.isCaptain, role: p.role,
      portraitUrl: portraits[p.nickname.toLowerCase()] || p.portraitUrl,
      avatar: portraits[p.nickname.toLowerCase()] || p.portraitUrl || p.avatar,
      rosterStatus: "academy", officialRoster: true,
    }));
  }, [live, portraits]);
  return { players, error };
}
