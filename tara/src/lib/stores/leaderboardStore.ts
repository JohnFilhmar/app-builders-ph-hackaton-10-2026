import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LeaderboardStore = {
  /** the name this install joined the board with; empty until it joins */
  username: string;
  setUsername: (username: string) => void;
};

/** Whether and as whom this install joined the leaderboard. Wiped with the app on uninstall, like the user id. */
export const useLeaderboardStore = create<LeaderboardStore>()(
  persist((set) => ({ username: '', setUsername: (username) => set({ username }) }), { name: 'tara-leaderboard', storage: createJSONStorage(() => AsyncStorage) }),
);
