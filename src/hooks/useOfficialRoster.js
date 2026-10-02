import { useCallback, useEffect, useMemo, useState } from "react";

import useFaceitStats from "./useFaceitStats.js";

const REFRESH_INTERVAL = 60_000;

function normalizeNickname(value) {
  return String(value || "").trim().toLowerCase();
}

function mergeOfficialPlayer(official, faceitRoster) {
  const faceitPlayer = faceitRoster.find((player) => {
    if (
      official.faceitPlayerId &&
      player?.playerId === official.faceitPlayerId
    ) {
      return true;
    }

    return (
      normalizeNickname(player?.nickname) ===
      normalizeNickname(official.nickname)
    );
  });

  return {
    ...(faceitPlayer || {}),
    playerId:
      faceitPlayer?.playerId ||
      official.faceitPlayerId ||
      official.nickname,
    nickname:
      official.nickname ||
      faceitPlayer?.nickname ||
      "",
    displayName:
      official.displayName ||
      official.nickname ||
      faceitPlayer?.nickname ||
      "",
    realName: official.realName || "",
    rosterStatus: official.status || "main",
    role:
      official.role ||
      faceitPlayer?.role ||
      "RIFLER",
    isCaptain: official.isCaptain === true,
    sortOrder: Number(official.sortOrder) || 0,
    country:
      official.country ||
      faceitPlayer?.country ||
      "",
    faceitUrl:
      official.faceitUrl ||
      faceitPlayer?.faceitUrl ||
      "",
    strengths: Array.isArray(official.strengths)
      ? official.strengths
      : [],
    officialUpdatedAt:
      official.updatedAt || null,
    officialRoster: true,
  };
}

export default function useOfficialRoster() {
  const {
    stats,
    loading: faceitLoading,
    error: faceitError,
    reload: reloadFaceit,
  } = useFaceitStats();

  const [officialPlayers, setOfficialPlayers] = useState([]);
  const [officialLoading, setOfficialLoading] = useState(true);
  const [officialError, setOfficialError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const loadOfficialRoster = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/roster?time=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok || result?.ok !== true) {
        throw new Error(
          result?.message ||
            `HTTP ${response.status}`,
        );
      }

      setSetupRequired(result.setupRequired === true);
      setOfficialPlayers(
        Array.isArray(result.players)
          ? result.players
          : [],
      );
      setOfficialError(null);
    } catch (error) {
      setOfficialError(
        error instanceof Error
          ? error.message
          : "Unknown error",
      );
    } finally {
      setOfficialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOfficialRoster();

    const intervalId = window.setInterval(
      loadOfficialRoster,
      REFRESH_INTERVAL,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadOfficialRoster]);

  const roster = useMemo(() => {
    const faceitRoster = Array.isArray(stats.roster)
      ? stats.roster
      : [];

    if (
      setupRequired ||
      officialPlayers.length === 0
    ) {
      return faceitRoster;
    }

    return officialPlayers.map((player) =>
      mergeOfficialPlayer(player, faceitRoster),
    );
  }, [officialPlayers, setupRequired, stats.roster]);

  const mergedStats = useMemo(
    () => ({
      ...stats,
      roster,
      officialRosterActive:
        !setupRequired &&
        officialPlayers.length > 0,
    }),
    [stats, roster, setupRequired, officialPlayers.length],
  );

  const reload = useCallback(async () => {
    await Promise.all([
      reloadFaceit(),
      loadOfficialRoster(),
    ]);
  }, [reloadFaceit, loadOfficialRoster]);

  return {
    stats: mergedStats,
    loading:
      faceitLoading ||
      officialLoading,
    error:
      officialError ||
      faceitError,
    setupRequired,
    reload,
  };
}
