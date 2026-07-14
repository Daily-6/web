"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type UserContextValue = {
  userId: number;
  username: string;
  setUserId: (id: number, name: string) => void;
};

const UserContext = createContext<UserContextValue>({
  userId: 1,
  username: "demo_user",
  setUserId: () => {},
});

const USERS = [
  { id: 1, username: "demo_user" },
  { id: 2, username: "football_fan" },
  { id: 3, username: "soccer_lover" },
];

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState(1);
  const [username, setUsername] = useState("demo_user");

  const setUserId = (id: number, name: string) => {
    setUserIdState(id);
    setUsername(name);
  };

  return (
    <UserContext.Provider value={{ userId, username, setUserId }}>
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-end gap-2 border-b border-slate-200 bg-slate-50 px-6 py-2">
          <span className="text-sm text-slate-500">当前用户:</span>
          <select
            value={userId}
            onChange={(e) => {
              const user = USERS.find((u) => u.id === Number(e.target.value));
              if (user) setUserId(user.id, user.username);
            }}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        {children}
      </div>
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
