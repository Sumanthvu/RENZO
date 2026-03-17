import { useMemo, useState } from 'react';
import { Code, Play, Terminal } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function SandboxPanel({
  isSandboxOpen,
  editorCode,
  setEditorCode,
  sandboxWidthPercent,
  setSandboxWidthPercent,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState('$ Sandbox ready...');
  const [isResizing, setIsResizing] = useState(false);
  const [language] = useState('javascript');

  const executeApiBase = useMemo(
    () => (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/users').replace('/api/users', '/api/v1/chats'),
    [],
  );

  const handleRunCode = async () => {
    if (isRunning) return;

    const code = String(editorCode || '');
    if (!code.trim()) {
      setRunOutput('⚠️ Please write some code before running.');
      return;
    }

    setIsRunning(true);
    setRunOutput('$ Running...');

    try {
      const response = await axiosClient.post(`${executeApiBase}/execute`, {
        code,
        language,
      });

      const data = response?.data?.data || {};
      const stdout = String(data.stdout || '');
      const stderr = String(data.stderr || '');
      const timedOut = Boolean(data.timedOut);
      const durationMs = typeof data.durationMs === 'number' ? data.durationMs : 0;
      const timedOutLabel = timedOut ? `\n\n⚠️ Execution timed out after ${durationMs}ms.` : '';
      const truncatedLabel = data.outputLimitExceeded ? '\n\n⚠️ Output truncated (limit reached).' : '';

      if (stderr.trim()) {
        setRunOutput(`ERROR:\n${stderr.trim()}${timedOutLabel}${truncatedLabel}`);
        return;
      }

      if (stdout.trim()) {
        setRunOutput(`${stdout.trim()}${timedOutLabel}${truncatedLabel}`);
        return;
      }

      setRunOutput(timedOut ? `⚠️ Execution timed out after ${durationMs}ms.` : '✅ Code executed (no output).');
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      const fallback = error?.message || 'Execution request failed';
      setRunOutput(`❌ ${serverMessage || fallback}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResizeStart = (event) => {
    event.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent) => {
      const nextPercent = ((window.innerWidth - moveEvent.clientX) / window.innerWidth) * 100;
      const clamped = Math.min(80, Math.max(25, nextPercent));
      setSandboxWidthPercent(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`relative border-l border-white/5 bg-[#0B0F19]/95 backdrop-blur-xl ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} flex flex-col shrink-0 ${isSandboxOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      style={{ width: isSandboxOpen ? `${sandboxWidthPercent}%` : 0 }}
    >
      {isSandboxOpen && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-white/10"
          title="Drag to resize"
        />
      )}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-200 flex items-center gap-2"><Code size={18} className="text-blue-400" /> Workspace</h3>
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all text-sm font-medium disabled:opacity-50"
          >
            <Play size={14} fill="currentColor" />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
        <div className="flex-1 rounded-xl border border-white/10 bg-[#0D1117] overflow-hidden">
          <textarea value={editorCode} onChange={(e) => setEditorCode(e.target.value)} spellCheck="false" className="w-full h-full bg-transparent text-gray-300 font-mono text-[13px] leading-relaxed p-4 resize-none focus:outline-none custom-scrollbar" />
        </div>
        <div className="h-[30%] min-h-[150px] rounded-xl border border-white/10 bg-black/60 overflow-hidden flex flex-col min-w-0">
          <div className="px-3 py-2 bg-white/5 border-b border-white/5 text-[11px] font-medium tracking-wider text-gray-400 uppercase flex gap-2 items-center"><Terminal size={14} /> Output</div>
          <div className="flex-1 min-h-0 p-4 font-mono text-[12px] overflow-y-auto custom-scrollbar text-gray-400 whitespace-pre-wrap break-words">{runOutput}</div>
        </div>
      </div>
    </div>
  );
}
