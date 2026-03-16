import { Code, Play, Terminal } from 'lucide-react';

export default function SandboxPanel({ isSandboxOpen, editorCode, setEditorCode }) {
  return (
    <div className={`border-l border-white/5 bg-[#0B0F19]/95 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col shrink-0 ${isSandboxOpen ? 'w-full md:w-[45%] lg:w-[40%] translate-x-0' : 'w-0 translate-x-full opacity-0'}`}>
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-200 flex items-center gap-2"><Code size={18} className="text-blue-400" /> Workspace</h3>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all text-sm font-medium"><Play size={14} fill="currentColor" /> Run Code</button>
        </div>
        <div className="flex-1 rounded-xl border border-white/10 bg-[#0D1117] overflow-hidden">
          <textarea value={editorCode} onChange={(e) => setEditorCode(e.target.value)} spellCheck="false" className="w-full h-full bg-transparent text-gray-300 font-mono text-[13px] leading-relaxed p-4 resize-none focus:outline-none custom-scrollbar" />
        </div>
        <div className="h-[30%] min-h-[150px] rounded-xl border border-white/10 bg-black/60 overflow-hidden">
          <div className="px-3 py-2 bg-white/5 border-b border-white/5 text-[11px] font-medium tracking-wider text-gray-400 uppercase flex gap-2 items-center"><Terminal size={14} /> Output</div>
          <div className="p-4 font-mono text-[12px] overflow-y-auto custom-scrollbar text-gray-400">$ Sandbox ready...</div>
        </div>
      </div>
    </div>
  );
}
