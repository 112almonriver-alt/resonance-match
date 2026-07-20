import { createContext, useContext, useState, ReactNode } from "react";

type OnboardingData = {
  genreIds: string[];
  artistIds: string[];
  energy: number;
  mainstream: number;
  era: number;
};

type OnboardingContextValue = {
  data: OnboardingData;
  setGenreIds: (ids: string[]) => void;
  setArtistIds: (ids: string[]) => void;
  setSliders: (vals: Partial<Pick<OnboardingData, "energy" | "mainstream" | "era">>) => void;
};

const defaultData: OnboardingData = {
  genreIds: [],
  artistIds: [],
  energy: 50,
  mainstream: 50,
  era: 50,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        setGenreIds: (genreIds) => setData((d) => ({ ...d, genreIds })),
        setArtistIds: (artistIds) => setData((d) => ({ ...d, artistIds })),
        setSliders: (vals) => setData((d) => ({ ...d, ...vals })),
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding должен использоваться внутри OnboardingProvider");
  return ctx;
}
