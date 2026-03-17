import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { executeCode } from '../services/execution/executeCode.service.js';
import { EXECUTION_LIMITS, normalizeExecutionLanguage } from '../services/execution/execution.config.js';
import { consumeExecutionQuota } from '../services/execution/execution.rateLimiter.js';

export const executeSandboxCode = asyncHandler(async (req, res) => {
  const { code, language = 'javascript' } = req.body || {};

  if (typeof code !== 'string') {
    throw new ApiError(400, 'Code must be a string');
  }

  if (!code.trim()) {
    throw new ApiError(400, 'Code cannot be empty');
  }

  const codeBytes = Buffer.byteLength(code, 'utf8');
  if (codeBytes > EXECUTION_LIMITS.maxCodeBytes) {
    throw new ApiError(413, `Code size exceeds ${EXECUTION_LIMITS.maxCodeBytes} bytes limit`);
  }

  const quota = consumeExecutionQuota({
    key: req.user?._id,
    windowMs: EXECUTION_LIMITS.rateWindowMs,
    maxRuns: EXECUTION_LIMITS.maxRunsPerWindow,
  });

  if (!quota.allowed) {
    throw new ApiError(429, `Execution rate limit exceeded. Try again in ${Math.ceil(quota.retryAfterMs / 1000)}s.`);
  }

  const result = await executeCode({
    code,
    language: normalizeExecutionLanguage(language),
  });

  return res.status(200).json(new ApiResponse(200, result, 'Code executed'));
});