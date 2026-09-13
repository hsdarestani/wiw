import { createContext, useContext, useEffect, useState } from "react";
import { Bootstrap, bootstrap, hasSession, login, logout } from "./api";

type SessionValue = {
  data: Bootstrap | null;
  loading: boolean;
  signedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};
const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => setData(await bootstrap());
  useEffect(() => {
    hasSession()
      .then((exists) => (exists ? refresh() : undefined))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);
  return (
    <SessionContext.Provider
      value={{
        data,
        loading,
        signedIn: Boolean(data),
        refresh,
        signIn: async (email, password) => {
          await login(email, password);
          await refresh();
        },
        signOut: async () => {
          await logout();
          setData(null);
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider is missing");
  return value;
};
