import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

const appendWithinLimit = ({
  current,
  chunk,
  maxBytes,
}) => {
  const chunkText = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk || '');
  const next = `${current}${chunkText}`;
  const nextBytes = Buffer.byteLength(next, 'utf8');

  if (nextBytes <= maxBytes) {
    return {
      text: next,
      overflowed: false,
    };
  }

  const remaining = Math.max(0, maxBytes - Buffer.byteLength(current, 'utf8'));
  const trimmed = remaining > 0 ? `${current}${Buffer.from(chunkText).subarray(0, remaining).toString('utf8')}` : current;

  return {
    text: trimmed,
    overflowed: true,
  };
};

export const executeJavaScript = async ({
  code,
  timeoutMs,
  maxOutputBytes,
}) => {
  const tempFilePath = path.join(os.tmpdir(), `renzo-exec-${randomUUID()}.js`);

  await fs.writeFile(tempFilePath, code, 'utf8');

  let stdout = '';
  let stderr = '';
  let timedOut = false;
  let outputLimitExceeded = false;
  const startedAt = Date.now();

  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [tempFilePath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        if (outputLimitExceeded) return;
        const next = appendWithinLimit({
          current: stdout,
          chunk,
          maxBytes: maxOutputBytes,
        });
        stdout = next.text;
        outputLimitExceeded = outputLimitExceeded || next.overflowed;
      });

      child.stderr.on('data', (chunk) => {
        if (outputLimitExceeded) return;
        const next = appendWithinLimit({
          current: stderr,
          chunk,
          maxBytes: maxOutputBytes,
        });
        stderr = next.text;
        outputLimitExceeded = outputLimitExceeded || next.overflowed;
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      child.on('close', (exitCode, signal) => {
        clearTimeout(timeoutId);
        resolve({
          exitCode,
          signal,
        });
      });
    });

    return {
      ...result,
      stdout,
      stderr,
      timedOut,
      outputLimitExceeded,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    await fs.unlink(tempFilePath).catch(() => {});
  }
};