"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, Role } from "@/types";
import { User } from "@supabase/supabase-js";

interface CurrentUser {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  isAdmin: boolean;
  isManager: boolean;
  loading: boolean;
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }

      setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const role = profile?.role ?? null;

  return {
    user,
    profile,
    role,
    isAdmin: role === "admin",
    isManager: role === "admin" || role === "manager",
    loading,
  };
}
