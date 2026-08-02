import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, account_number, created_at, updated_at";

const LEGACY_PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, created_at, updated_at";

async function loadProfile(userId) {
  const profileQuery = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (!profileQuery.error) {
    return profileQuery.data;
  }

  const missingAccountNumber =
    profileQuery.error.message?.includes("account_number") ||
    profileQuery.error.details?.includes("account_number");

  if (!missingAccountNumber) {
    throw profileQuery.error;
  }

  const legacyQuery = await supabase
    .from("profiles")
    .select(LEGACY_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (legacyQuery.error) {
    throw legacyQuery.error;
  }

  return {
    ...legacyQuery.data,
    account_number: null,
  };
}

async function loadAccount(userId) {
  const { data: access, error: accessError } = await supabase
    .from("user_roles")
    .select("role, is_blocked, blocked_reason")
    .eq("user_id", userId)
    .maybeSingle();

  if (accessError) {
    throw accessError;
  }

  const isBlocked = access?.is_blocked ?? false;

  if (isBlocked) {
    return {
      profile: null,
      role: access?.role ?? "user",
      isBlocked: true,
      blockedReason: access?.blocked_reason ?? "",
    };
  }

  const profile = await loadProfile(userId);

  return {
    profile,
    role: access?.role ?? "user",
    isBlocked: false,
    blockedReason: "",
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("user");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [accountError, setAccountError] = useState("");
  const requestNumberRef = useRef(0);

  const applySession = useCallback(async (nextSession) => {
    const requestNumber = requestNumberRef.current + 1;
    requestNumberRef.current = requestNumber;

    const nextUser = nextSession?.user ?? null;

    setSession(nextSession);
    setUser(nextUser);
    setAccountError("");

    if (!nextUser) {
      setProfile(null);
      setRole("user");
      setIsBlocked(false);
      setBlockedReason("");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const account = await loadAccount(nextUser.id);

      if (requestNumber !== requestNumberRef.current) {
        return;
      }

      setProfile(account.profile);
      setRole(account.role);
      setIsBlocked(account.isBlocked);
      setBlockedReason(account.blockedReason);
    } catch (error) {
      if (requestNumber !== requestNumberRef.current) {
        return;
      }

      setProfile(null);
      setRole("user");
      setIsBlocked(false);
      setBlockedReason("");
      setAccountError(error?.message ?? "Не удалось загрузить профиль.");
    } finally {
      if (requestNumber === requestNumberRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setAccountError(error.message);
        setLoading(false);
        return;
      }

      void applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        if (isMounted) {
          void applySession(nextSession);
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshAccount = useCallback(async () => {
    if (!user) {
      return;
    }

    const account = await loadAccount(user.id);

    setProfile(account.profile);
    setRole(account.role);
    setIsBlocked(account.isBlocked);
    setBlockedReason(account.blockedReason);
    setAccountError("");
  }, [user]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      isBlocked,
      blockedReason,
      loading,
      accountError,
      isAdministrator: role === "admin" || role === "owner",
      refreshAccount,
      signOut,
    }),
    [
      session,
      user,
      profile,
      role,
      isBlocked,
      blockedReason,
      loading,
      accountError,
      refreshAccount,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
