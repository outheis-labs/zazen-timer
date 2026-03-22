const CONFIGS_KEY = 'zazen-configs';

export const loadConfigs = () => {
  try {
    const stored = localStorage.getItem(CONFIGS_KEY);
    if (stored) {
      const configs = JSON.parse(stored);
      if (configs.length > 0) return configs;
    }
    // Default config on first load
    const defaultConfig = {
      id: 1,
      customName: '',
      ...DEFAULTS
    };
    return [defaultConfig];
  } catch {
    return [];
  }
};

export const saveConfigs = (configs) => {
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
};

export const DEFAULTS = {
  rounds: 1,
  zazenMin: 25,
  kinhinMin: 0,
  prepareSeconds: 15,
  returnSeconds: 30,
};

export const generateConfigName = (config) => {
  const { rounds, zazenMin, kinhinMin } = config;
  if (rounds === 1) {
    return kinhinMin > 0 ? `${zazenMin}min + Kinhin` : `${zazenMin}min`;
  }
  return kinhinMin > 0 ? `${rounds}× ${zazenMin}min + Kinhin` : `${rounds}× ${zazenMin}min`;
};
