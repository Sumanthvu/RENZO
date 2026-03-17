export const SUPPORTED_EXECUTION_LANGUAGES = ['javascript'];

export const EXECUTION_LIMITS = {
  maxCodeBytes: 50 * 1024,
  maxOutputBytes: 64 * 1024,
  timeoutMs: 3000,
  rateWindowMs: 60 * 1000,
  maxRunsPerWindow: 20,
};

export const normalizeExecutionLanguage = (language) => {
  const raw = String(language || 'javascript').trim().toLowerCase();

  if (raw === 'js' || raw === 'node' || raw === 'nodejs') {
    return 'javascript';
  }

  return raw;
};