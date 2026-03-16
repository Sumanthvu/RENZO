import { Menu, Plus, MessageSquare, X, Inbox, Shield, ShieldCheck, Users } from 'lucide-react';

export default function SidebarPanel({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarView,
  setSidebarView,
  isInboxView,
  isSharedView,
  isOwnedView,
  inboxInvites,
  chats,
  sharedChats,
  activeChatId,
  setActiveChatId,
  setIsNewChatDraft,
  setMessages,
  respondToInvite,
}) {
  return (
    <>
      <div className="fixed inset-y-0 left-0 z-50 w-12 border-r border-white/10 bg-black/90 backdrop-blur-xl flex flex-col items-center py-4 gap-2">
        <button className={`h-9 w-9 rounded-xl text-gray-200 flex items-center justify-center transition-colors ${isSidebarOpen && isOwnedView ? 'bg-white/[0.12]' : 'bg-white/[0.04] hover:bg-white/[0.08]'}`} onClick={() => {
          if (isSidebarOpen && isOwnedView) {
            setIsSidebarOpen(false);
          } else {
            setSidebarView('owned');
            setIsSidebarOpen(true);
          }
        }}>
          <Menu size={20} />
        </button>

        <button
          onClick={() => {
            if (isSidebarOpen && isSharedView) {
              setIsSidebarOpen(false);
            } else {
              setSidebarView('shared');
              setIsSidebarOpen(true);
            }
          }}
          className={`relative h-9 w-9 rounded-xl text-gray-200 flex items-center justify-center transition-colors ${isSidebarOpen && isSharedView ? 'bg-white/[0.12]' : 'bg-white/[0.04] hover:bg-white/[0.08]'}`}
          title="Shared chats"
        >
          <Users size={17} />
        </button>

        <button
          onClick={() => {
            if (isSidebarOpen && isInboxView) {
              setIsSidebarOpen(false);
            } else {
              setSidebarView('inbox');
              setIsSidebarOpen(true);
            }
          }}
          className={`relative h-9 w-9 rounded-xl text-gray-200 flex items-center justify-center transition-colors ${isInboxView && isSidebarOpen ? 'bg-white/[0.12]' : 'bg-white/[0.04] hover:bg-white/[0.08]'}`}
          title="Inbox"
        >
          <Inbox size={17} />
          {inboxInvites.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center">
              {Math.min(inboxInvites.length, 9)}
            </span>
          )}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-12 z-40 w-[300px] transform border-r border-white/10 bg-[#0c0e13]/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-xl font-semibold tracking-tight text-white/95">{isInboxView ? 'Inbox' : isSharedView ? 'Shared chats' : 'Renzo'}</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"><X size={18} /></button>
        </div>

        {isOwnedView && (
          <div className="px-3 pt-3 space-y-1.5">
            <button
              onClick={() => {
                setIsNewChatDraft(true);
                setActiveChatId(null);
                setMessages([]);
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-colors"
            >
              <Plus size={17} className="text-gray-200" />
              <span className="text-sm font-medium text-gray-100">New chat</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4 no-scrollbar smooth-scroll">
          {isInboxView ? (
            <div className="space-y-2">
              {inboxInvites.length === 0 ? (
                <p className="text-sm text-gray-400 px-2">No pending collaboration requests.</p>
              ) : (
                inboxInvites.map((invite) => (
                  <div key={invite._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm text-white font-medium truncate">{invite.chatTitle || 'Shared chat invite'}</p>
                    <p className="text-xs text-gray-400 mt-1">From: {invite.inviter?.fullName || invite.inviter?.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Access: {invite.permission === 'write' ? 'Read + Write' : 'Read only'}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => respondToInvite(invite._id, 'accept')}
                        className="flex-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs py-1.5 hover:bg-blue-500/30 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToInvite(invite._id, 'reject')}
                        className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 text-gray-300 text-xs py-1.5 hover:bg-white/[0.08] transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : isOwnedView ? (
            <>
              <p className="px-2 mb-2 text-[11px] uppercase tracking-[0.16em] text-gray-500">Your chats</p>
              <div className="space-y-1">
                {chats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => {
                      setIsNewChatDraft(false);
                      setActiveChatId(chat._id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${activeChatId === chat._id ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/[0.05]'}`}
                  >
                    <MessageSquare size={15} className={`${activeChatId === chat._id ? 'text-white' : 'text-gray-500'}`} />
                    <span className="truncate text-sm">{chat.title}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="px-2 mb-2 text-[11px] uppercase tracking-[0.16em] text-gray-500">Shared chats</p>
              <div className="space-y-1">
                {sharedChats.length === 0 ? (
                  <p className="px-2 text-xs text-gray-500">No shared chats yet</p>
                ) : (
                  sharedChats.map((chat) => (
                    <button
                      key={chat._id}
                      onClick={() => {
                        setIsNewChatDraft(false);
                        setActiveChatId(chat._id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${activeChatId === chat._id ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/[0.05]'}`}
                    >
                      {chat.accessLevel === 'write' ? <ShieldCheck size={15} className="text-blue-300" /> : <Shield size={15} className="text-gray-500" />}
                      <span className="truncate text-sm">{chat.title}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-y-0 right-0 left-12 z-30 bg-black/45" onClick={() => setIsSidebarOpen(false)} />}
    </>
  );
}
