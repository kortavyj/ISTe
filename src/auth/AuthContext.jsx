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
  const [session, setSession] = use
