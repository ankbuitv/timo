import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { api } from "./api";
import { getSupabase } from "./supabase";

export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextValue {
  session: Session | null;
  user: CurrentUser | null;
  /** true khi đang kiểm tra phiên hoặc tải hồ sơ */
  loading: boolean;
  authConfigured: boolean;
  signOut: () => Promise<void>;
  /** Kiểm tra quyền chỉ để hiển thị UI. Máy chủ luôn kiểm tra lại. */
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") queryClient.removeQueries({ queryKey: ["me"] });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  const meQuery = useQuery({
    queryKey: ["me", session?.user.id ?? null],
    queryFn: async () => (await api.get<CurrentUser>("/me")).data,
    enabled: !!session,
    retry: false,
  });

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    queryClient.clear();
  }, [supabase, queryClient]);

  const user = session ? (meQuery.data ?? null) : null;
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user]);

  const value: AuthContextValue = {
    session,
    user,
    loading: sessionLoading || (!!session && meQuery.isPending),
    authConfigured: !!supabase,
    signOut,
    can: (permission) => permissions.has(permission),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng trong AuthProvider");
  return ctx;
}
