"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { User } from "@/types/user";

interface SignupData {
  fullName: string;
  university: string;
  location: string;
  skills: string[];
  interests: string[];
  githubOrPortfolio: string;
  profilePicture: string;
  email: string;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => UserRoleResult;
  signup: (data: SignupData, password: string) => User;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

type UserRoleResult = "user" | "admin" | null;

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "hackhive_user";
const ACCOUNTS_KEY = "hackhive_accounts";

interface StoredAccount {
  user: User;
  password: string;
}

const studentDemo: StoredAccount = {
  user: {
    id: "student-demo",
    role: "user",
    fullName: "Riya Sharma",
    email: "riya@hackhive.dev",
    university: "ABC University",
    location: "Bengaluru, India",
    bio: "Passionate developer who loves building meaningful products.",
    skills: ["React", "Python", "Figma"],
    interests: ["Web Development", "UI/UX", "AI"],
    githubOrPortfolio: "https://github.com",
    profilePicture: "",
  },
  password: "demo1234",
};

const adminDemo: StoredAccount = {
  user: {
    id: "admin-demo",
    role: "admin",
    fullName: "HackHive Admin",
    email: "admin@hackhive.dev",
    university: "",
    location: "",
    bio: "",
    skills: [],
    interests: [],
    githubOrPortfolio: "",
    profilePicture: "",
  },
  password: "admin1234",
};

function getAccounts(): StoredAccount[] {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    const accounts = stored ? JSON.parse(stored) : [];

    return [
      studentDemo,
      adminDemo,
      ...(Array.isArray(accounts) ? accounts : []),
    ];
  } catch {
    return [studentDemo, adminDemo];
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setLoading(false);
  }, []);

  const login = (email: string, password: string): UserRoleResult => {
    const account = getAccounts().find(
      (item) =>
        item.user.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password
    );

    if (!account) return null;

    setUser(account.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account.user));

    return account.user.role;
  };

  const signup = (data: SignupData, password: string): User => {
    const accounts = getAccounts();

    const existing = accounts.some(
      (account) =>
        account.user.email.toLowerCase() === data.email.trim().toLowerCase()
    );

    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      role: "user",
      fullName: data.fullName,
      email: data.email,
      university: data.university,
      location: data.location,
      bio: "",
      skills: data.skills,
      interests: data.interests,
      githubOrPortfolio: data.githubOrPortfolio,
      profilePicture: data.profilePicture,
    };

    const updatedAccounts = [
      ...accounts.filter(
        (account) =>
          account.user.id !== studentDemo.user.id &&
          account.user.id !== adminDemo.user.id
      ),
      { user: newUser, password },
    ];

    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

    setUser(newUser);

    return newUser;
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data, role: user.role };

    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    const accounts = getAccounts().filter(
      (account) =>
        account.user.id !== studentDemo.user.id &&
        account.user.id !== adminDemo.user.id
    );

    const updatedAccounts = accounts.map((account) =>
      account.user.id === updatedUser.id
        ? { ...account, user: updatedUser }
        : account
    );

    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
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