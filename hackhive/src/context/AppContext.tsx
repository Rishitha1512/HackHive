
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { User } from "@/types/user";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AppContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Fetch the authenticated user's profile from Supabase.
  const fetchUserProfile = async (
    authUser: SupabaseUser
  ): Promise<User> => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error.message);
      throw error;
    }

    return {
      id: authUser.id,
      role: "user",
      fullName:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        "",
      email: authUser.email || "",
      university: profile?.university || "",
      location: profile?.location || "",
      bio: profile?.bio || "",
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      githubOrPortfolio: profile?.github_url || "",
      profilePicture: profile?.avatar_url || "",
    };
  };

  // Listen for Supabase login, logout and session changes.
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Defer the database request until after the auth callback.
      Promise.resolve().then(async () => {
        try {
          const appUser = await fetchUserProfile(session.user);

          if (mounted) {
            setUser(appUser);
          }
        } catch (error) {
          console.error("Could not load user profile:", error);

          if (mounted) {
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign out from Supabase.
  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
  };

  // Update the authenticated user's profile in Supabase.
  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.fullName !== undefined) {
      updates.full_name = data.fullName;
    }

    if (data.university !== undefined) {
      updates.university = data.university;
    }

    if (data.location !== undefined) {
      updates.location = data.location;
    }

    if (data.bio !== undefined) {
      updates.bio = data.bio;
    }

    if (data.skills !== undefined) {
      updates.skills = data.skills;
    }

    if (data.interests !== undefined) {
      updates.interests = data.interests;
    }

    if (data.githubOrPortfolio !== undefined) {
      updates.github_url = data.githubOrPortfolio;
    }

    if (data.profilePicture !== undefined) {
      updates.avatar_url = data.profilePicture;
    }

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error.message);
      throw error;
    }

    setUser({
      ...user,
      fullName: updatedProfile.full_name || "",
      university: updatedProfile.university || "",
      location: updatedProfile.location || "",
      bio: updatedProfile.bio || "",
      skills: updatedProfile.skills || [],
      interests: updatedProfile.interests || [],
      githubOrPortfolio: updatedProfile.github_url || "",
      profilePicture: updatedProfile.avatar_url || "",
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}
