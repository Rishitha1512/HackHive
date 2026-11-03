export type UserRole = "user" | "admin";

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  university: string;
  location: string;
  bio: string;
  skills: string[];
  interests: string[];
  githubOrPortfolio: string;
  profilePicture: string;
}