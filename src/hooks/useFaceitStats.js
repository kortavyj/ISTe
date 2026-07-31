import { useCallback, useEffect, useState } from "react";

const EMPTY_STATS = Object.freeze({
  source: "FACEIT",
  sourceUrl: "https://www.faceit.com/ru/teams/fe19e71d-c974-404c-a038-beb9a578fb61",
  tournaments: null,
  matches: null,
  wins: null,
  winRate: null,
  players: null,
  roster: [],
  roleModel: null,
  teamAvatar: null,
  teamMatches: [],
  teamMatchCount: 0,
  matchSync: null,
  updatedAt: null,
});

const REFRESH_INTERVAL = 60_000;

export default function useFaceitStats() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const dataUrl = `${import.meta.env.BASE_URL}data/faceit-stats.json?time=${Date.now()}`;
      const response = await fetch(dataUrl, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      setStats({ ...EMPTY_STATS, ...payload });
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const intervalId = window.setInterval(loadStats, REFRESH_INTERVAL);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        loadStats();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadStats]);

  return { stats, loading, error, reload: loadStats };
}
