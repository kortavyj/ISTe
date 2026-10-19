import { useEffect, useMemo, useState } from "react";
import { ACADEMY_PLAYERS } from "../data/academyRoster.js";

export default function useAcademyRoster(enabled = true) {
  const [live, setLive] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false;
    const load = async () => {
      try {
        const response = await fetch("/api/academy-stats", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("FACEIT unavailable");
        const data = await response.json();
        if (!disposed) { setLive(Array.isArray(data.players) ? data.players : []); setError(false); }
      } catch {
        if (!disposed) setError(true);
      }
    };
    void load();
    const interval = window.setInterval(load, 300000);
    return () => { disposed = true; window.clearInterval(interval); };
  }, [enabled]);
  const players = useMemo(() => {
    const byNick = new Map(live.map((p) => [String(p.nickname).toLowerCase(), p]));
    return ACADEMY_PLAYERS.map((p) => ({
      ...p, ...(byNick.get(p.nickname.toLowerCase()) || {}),
      isCaptain: p.isCaptain, role: p.role,
      rosterStatus: "academy", officialRoster: true,
    }));
  }, [live]);
  return { players, error };
}
