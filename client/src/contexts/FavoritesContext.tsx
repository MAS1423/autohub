import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface FavItem { id: number; type: 'vehicle' | 'dealer'; data: any; }

interface FavoritesContextType {
  favorites: FavItem[];
  addFavorite: (item: FavItem) => void;
  removeFavorite: (id: number, type: 'vehicle' | 'dealer') => void;
  isFavorite: (id: number, type: 'vehicle' | 'dealer') => boolean;
  vehicleFavorites: FavItem[];
  dealerFavorites: FavItem[];
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  vehicleFavorites: [],
  dealerFavorites: [],
});

const LEGACY_STORAGE_KEY = 'autohub_favorites';

function readFavorites(key: string, allowLegacy = false): FavItem[] {
  try {
    const raw = localStorage.getItem(key) ?? (allowLegacy ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'number' && (item.type === 'vehicle' || item.type === 'dealer')) : [];
  } catch { return []; }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = trpc.auth.me.useQuery();
  const storageKey = user?.id ? `autohub_favorites_user_${user.id}` : 'autohub_favorites_guest';
  const [favorites, setFavorites] = useState<FavItem[]>([]);
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useEffect(() => {
    setReadyKey(null);
    setFavorites(readFavorites(storageKey, !user?.id));
    setReadyKey(storageKey);
  }, [storageKey, user?.id]);

  useEffect(() => {
    if (readyKey !== storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(favorites)); } catch {}
  }, [favorites, readyKey, storageKey]);

  const value = useMemo<FavoritesContextType>(() => ({
    favorites,
    addFavorite: (item: FavItem) => setFavorites(previous => previous.some(favorite => favorite.id === item.id && favorite.type === item.type) ? previous : [...previous, item]),
    removeFavorite: (id: number, type: 'vehicle' | 'dealer') => setFavorites(previous => previous.filter(favorite => !(favorite.id === id && favorite.type === type))),
    isFavorite: (id: number, type: 'vehicle' | 'dealer') => favorites.some(favorite => favorite.id === id && favorite.type === type),
    vehicleFavorites: favorites.filter(favorite => favorite.type === 'vehicle'),
    dealerFavorites: favorites.filter(favorite => favorite.type === 'dealer'),
  }), [favorites]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
