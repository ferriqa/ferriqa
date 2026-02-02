import type { User } from "./types";

const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@ferriqa.dev",
    role: "admin",
    isActive: true,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: "2",
    email: "editor@ferriqa.dev",
    role: "editor",
    isActive: true,
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: "3",
    email: "viewer@ferriqa.dev",
    role: "viewer",
    isActive: true,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
];

// WARNING: These are plaintext passwords for development/testing only.
// In production, use bcrypt/scrypt/argon2 with proper salt and pepper.
const mockPasswords: Record<string, string> = {
  "admin@ferriqa.dev": "admin123",
  "editor@ferriqa.dev": "editor123",
  "viewer@ferriqa.dev": "viewer123",
};

export class UserService {
  async getById(id: string): Promise<User | null> {
    return mockUsers.find((u) => u.id === id) ?? null;
  }

  async getByEmail(email: string): Promise<User | null> {
    return mockUsers.find((u) => u.email === email) ?? null;
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const storedPassword = mockPasswords[email];
    if (storedPassword !== password) {
      return null;
    }

    return user;
  }

  async list(): Promise<User[]> {
    return [...mockUsers];
  }
}

export const userService = new UserService();
