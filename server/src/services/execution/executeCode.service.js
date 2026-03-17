import { ApiError } from '../../utils/ApiError.js';
import {
  EXECUTION_LIMITS,
  SUPPORTED_EXECUTION_LANGUAGES,
  normalizeExecutionLanguage,
} from './execution.config.js';
import { executeJavaScript } from './javascriptExecutor.js';

export const executeCode = async ({ code, language }) => {
  const normalizedLanguage = normalizeExecutionLanguage(language);

  if (!SUPPORTED_EXECUTION_LANGUAGES.includes(normalizedLanguage)) {
    throw new ApiError(400, `Unsupported language: ${normalizedLanguage}`);
  }

  if (normalizedLanguage === 'javascript') {
    return executeJavaScript({
      code,
      timeoutMs: EXECUTION_LIMITS.timeoutMs,
      maxOutputBytes: EXECUTION_LIMITS.maxOutputBytes,
    });
  }

  throw new ApiError(400, 'Unsupported execution request');
};