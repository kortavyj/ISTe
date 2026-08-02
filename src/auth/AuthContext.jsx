import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const AuthContext = createContext(null);

async function readApiResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Сервер вернул некорректный ответ.",
    );
  }

  if (!response.ok || result?.ok !== true) {
    throw new Error(
      result?.message ||
        "Не удалось выполнить запрос.",
    );
  }

  return result;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("user");

  const [isBlocked, setIsBlocked] =
    useState(false);

  const [blockedReason, setBlockedReason] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [accountError, setAccountError] =
    useState("");

  const requestNumberRef = useRef(0);

  const resetAccount = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole("user");
    setIsBlocked(false);
    setBlockedReason("");
  }, []);

  const loadSession = useCallback(
    async ({
      showLoading = false,
    } = {}) => {
      const requestNumber =
        requestNumberRef.current + 1;

      requestNumberRef.current =
        requestNumber;

      if (showLoading) {
        setLoading(true);
      }

      setAccountError("");

      try {
        const response = await fetch(
          "/api/auth/session",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",

            headers: {
              Accept: "application/json",
            },
          },
        );

        const result =
          await readApiResponse(response);

        if (
          requestNumber !==
          requestNumberRef.current
        ) {
          return result;
        }

        if (
          result.authenticated !== true ||
          !result.user
        ) {
          resetAccount();
          return result;
        }

        setSession({
          authenticated: true,
          user: result.user,
        });

        setUser(result.user);
        setProfile(result.profile ?? null);
        setRole(result.role || "user");

        setIsBlocked(
          result.isBlocked === true,
        );

        setBlockedReason(
          result.blockedReason || "",
        );

        return result;
      } catch (error) {
        if (
          requestNumber ===
          requestNumberRef.current
        ) {
          resetAccount();

          setAccountError(
            error?.message ||
              "Не удалось загрузить аккаунт.",
          );
        }

        throw error;
      } finally {
        if (
          requestNumber ===
          requestNumberRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [resetAccount],
  );

  useEffect(() => {
    void loadSession({
      showLoading: true,
    }).catch(() => {});

    return () => {
      requestNumberRef.current += 1;
    };
  }, [loadSession]);

  const refreshAccount = useCallback(
    async () =>
      loadSession({
        showLoading: false,
      }),
    [loadSession],
  );

  const refreshSession = refreshAccount;

  const signOut = useCallback(async () => {
    const response = await fetch(
      "/api/auth/logout",
      {
        method: "POST",
        credentials: "include",

        headers: {
          Accept: "application/json",
        },
      },
    );

    await readApiResponse(response);

    requestNumberRef.current += 1;

    resetAccount();
    setAccountError("");
    setLoading(false);
  }, [resetAccount]);

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

      authenticated: Boolean(user),

      isAdministrator:
        role === "admin" ||
        role === "owner",

      refreshAccount,
      refreshSession,
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
      refreshSession,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}
