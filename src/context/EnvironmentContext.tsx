import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppEnvironment = 'demo' | 'live';

interface EnvironmentContextType {
  environment: AppEnvironment;
  isDemoMode: boolean;
  isLiveMode: boolean;
  toggleEnvironment: () => void;
  setEnvironment: (env: AppEnvironment) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

const ENV_STORAGE_KEY = 's2s_environment_mode';

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environment, setEnvironmentState] = useState<AppEnvironment>(() => {
    try {
      const saved = localStorage.getItem(ENV_STORAGE_KEY);
      if (saved === 'demo' || saved === 'live') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'demo'; // Default to Demo Sandbox
  });

  useEffect(() => {
    try {
      localStorage.setItem(ENV_STORAGE_KEY, environment);
      // Sync with backend API
      fetch('/api/settings/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment })
      }).catch(() => {
        // Non-blocking failover
      });
    } catch {
      // ignore
    }
  }, [environment]);

  const toggleEnvironment = () => {
    setEnvironmentState((prev) => (prev === 'demo' ? 'live' : 'demo'));
  };

  const setEnvironment = (newEnv: AppEnvironment) => {
    setEnvironmentState(newEnv);
  };

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        isDemoMode: environment === 'demo',
        isLiveMode: environment === 'live',
        toggleEnvironment,
        setEnvironment
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = (): EnvironmentContextType => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};
