import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CompareVehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  condition: 'new' | 'used';
  fuelType: string;
  transmission: string;
  mileage: number;
  color: string | null;
  images: string;
  dealerName?: string;
  dealerCity?: string;
  videoUrl?: string | null;
}

interface CompareContextType {
  compareList: CompareVehicle[];
  addToCompare: (vehicle: CompareVehicle) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextType>({
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
  canAdd: true,
});

const STORAGE_KEY = 'autohub_compare';

function readStoredComparison(): CompareVehicle[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((vehicle): vehicle is CompareVehicle => Boolean(
        vehicle && typeof vehicle === 'object' &&
        typeof (vehicle as CompareVehicle).id === 'number' &&
        typeof (vehicle as CompareVehicle).brand === 'string' &&
        typeof (vehicle as CompareVehicle).model === 'string',
      ))
      .slice(0, 3);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<CompareVehicle[]>(readStoredComparison);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
    } catch {
      // Comparison remains usable during this session even if browser storage is unavailable.
    }
  }, [compareList]);

  const addToCompare = (vehicle: CompareVehicle) => {
    setCompareList(previous => {
      if (previous.some(item => item.id === vehicle.id)) return previous;
      if (previous.length >= 3) return previous;
      return [...previous, vehicle];
    });
  };

  const removeFromCompare = (id: number) => {
    setCompareList(previous => previous.filter(vehicle => vehicle.id !== id));
  };

  const clearCompare = () => setCompareList([]);
  const isInCompare = (id: number) => compareList.some(vehicle => vehicle.id === id);
  const canAdd = compareList.length < 3;

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, canAdd }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
