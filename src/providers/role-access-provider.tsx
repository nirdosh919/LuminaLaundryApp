import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { restoreSession, type AccountRole } from "@/lib/auth";

type RoleAccessValue = {
  role: AccountRole | null;
  sessionReady: boolean;
  sessionError: string;
  activateRole: (role: AccountRole) => void;
  clearRole: () => void;
  retrySessionRestore: () => void;
  continueSignedOut: () => void;
};

const RoleAccessContext = createContext<RoleAccessValue | null>(null);

export function RoleAccessProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AccountRole | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    void restoreSession()
      .then((account) => {
        if (active) setRole(account?.role ?? null);
      })
      .catch((error: unknown) => {
        console.error("Session restore failed:", error);
        if (active) {
          setRole(null);
          setSessionError(
            error instanceof Error ? error.message : "Could not verify your saved session.",
          );
        }
      })
      .finally(() => {
        if (active) setSessionReady(true);
      });

    return () => {
      active = false;
    };
  }, [restoreAttempt]);

  const retrySessionRestore = useCallback(() => {
    setSessionReady(false);
    setSessionError("");
    setRestoreAttempt((attempt) => attempt + 1);
  }, []);

  const value = useMemo<RoleAccessValue>(() => ({
    role,
    sessionReady,
    sessionError,
    activateRole: setRole,
    clearRole: () => setRole(null),
    retrySessionRestore,
    continueSignedOut: () => {
      setRole(null);
      setSessionError("");
      setSessionReady(true);
    },
  }), [role, sessionReady, sessionError, retrySessionRestore]);

  return <RoleAccessContext.Provider value={value}>{children}</RoleAccessContext.Provider>;
}

export function useRoleAccess() {
  const value = useContext(RoleAccessContext);
  if (!value) throw new Error("useRoleAccess must be used inside RoleAccessProvider.");
  return value;
}
