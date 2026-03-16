import { X } from 'lucide-react';

export default function InviteCollaboratorModal({
  isInviteModalOpen,
  setIsInviteModalOpen,
  inviteError,
  setInviteError,
  inviteEmail,
  setInviteEmail,
  invitePermission,
  setInvitePermission,
  sendInvite,
  isSendingInvite,
}) {
  if (!isInviteModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[190] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setInviteError(''); setIsInviteModalOpen(false); }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111520] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Add collaborator</h3>
          <button onClick={() => { setInviteError(''); setIsInviteModalOpen(false); }} className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {inviteError && (
          <div className="mb-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            ⚠️ {inviteError}
          </div>
        )}

        <label className="block text-xs text-gray-400 mb-2">Collaborator email</label>
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => {
            if (inviteError) setInviteError('');
            setInviteEmail(e.target.value);
          }}
          placeholder="name@example.com"
          className="w-full rounded-xl border border-white/10 bg-[#0d1119] px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400/40"
        />

        <label className="block text-xs text-gray-400 mt-4 mb-2">Permission</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setInvitePermission('read')}
            className={`rounded-xl border px-3 py-2 text-sm transition-colors ${invitePermission === 'read' ? 'border-blue-400/40 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]'}`}
          >
            Read
          </button>
          <button
            onClick={() => setInvitePermission('write')}
            className={`rounded-xl border px-3 py-2 text-sm transition-colors ${invitePermission === 'write' ? 'border-blue-400/40 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]'}`}
          >
            Read + Write
          </button>
        </div>

        <button
          onClick={sendInvite}
          disabled={!inviteEmail.trim() || isSendingInvite}
          className="mt-5 w-full rounded-xl bg-white text-black py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors"
        >
          {isSendingInvite ? 'Sending...' : 'Send request'}
        </button>
      </div>
    </div>
  );
}
