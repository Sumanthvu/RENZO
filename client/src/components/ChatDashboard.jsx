import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { User, Send, PanelRightOpen, PanelRightClose, Paperclip, Mic, X, UserPlus } from 'lucide-react';
import useChatDashboardLogic from '../hooks/useChatDashboardLogic';
import SidebarPanel from './chatdashboard/SidebarPanel';
import InviteCollaboratorModal from './chatdashboard/InviteCollaboratorModal';
import ImagePreviewModal from './chatdashboard/ImagePreviewModal';
import SandboxPanel from './chatdashboard/SandboxPanel';
import { mdComponents, CopyButton } from './chatdashboard/MarkdownRenderers';

export default function ChatDashboard() {
  const [sandboxWidthPercent, setSandboxWidthPercent] = useState(40);

  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isSandboxOpen,
    setIsSandboxOpen,
    isProfileMenuOpen,
    setIsProfileMenuOpen,
    sidebarView,
    setSidebarView,
    setIsNewChatDraft,
    chats,
    sharedChats,
    inboxInvites,
    activeChatId,
    setActiveChatId,
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    isInviteModalOpen,
    setIsInviteModalOpen,
    inviteEmail,
    setInviteEmail,
    invitePermission,
    setInvitePermission,
    isSendingInvite,
    inviteError,
    setInviteError,
    attachedFiles,
    previewImage,
    setPreviewImage,
    editorCode,
    setEditorCode,
    chatContainerRef,
    profileMenuRef,
    fileInputRef,
    folderInputRef,
    userName,
    currentUserId,
    isInboxView,
    isSharedView,
    isOwnedView,
    activeChatMeta,
    canWriteCurrentChat,
    canManageCollaborators,
    sendInvite,
    respondToInvite,
    handleFilesPicked,
    handleAttachClick,
    removeAttachment,
    handleSendMessage,
    handleLogout,
  } = useChatDashboardLogic();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white flex" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(72,96,145,0.14),transparent_38%),linear-gradient(180deg,#040507_0%,#020203_100%)]" />
      </div>

      <SidebarPanel
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarView={sidebarView}
        setSidebarView={setSidebarView}
        isInboxView={isInboxView}
        isSharedView={isSharedView}
        isOwnedView={isOwnedView}
        inboxInvites={inboxInvites}
        chats={chats}
        sharedChats={sharedChats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        setIsNewChatDraft={setIsNewChatDraft}
        setMessages={setMessages}
        respondToInvite={respondToInvite}
      />

      <div className="relative z-10 flex flex-col flex-1 min-w-0 ml-12">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesPicked}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={handleFilesPicked}
        />

        <header className="h-14 px-4 md:px-6 border-b border-white/10 bg-black/55 backdrop-blur-xl flex items-center justify-between">
          <div className="text-xs md:text-sm text-gray-400 truncate pr-3">
            {activeChatMeta ? (
              <span>
                {activeChatMeta.accessLevel === 'owner' ? 'Owner' : activeChatMeta.accessLevel === 'write' ? 'Shared • Read + Write' : 'Shared • Read only'}
              </span>
            ) : (
              <span>New chat</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeChatId && (
              <button
                onClick={() => {
                  if (!canManageCollaborators) return;
                  setInviteError('');
                  setIsInviteModalOpen(true);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${canManageCollaborators ? 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]' : 'border-white/10 bg-white/[0.02] text-gray-500 cursor-not-allowed'}`}
                title={canManageCollaborators ? 'Add collaborator' : 'Only chat owner can add collaborators'}
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Add collaborator</span>
              </button>
            )}

            <button
              onClick={() => setIsSandboxOpen(!isSandboxOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${isSandboxOpen ? 'border-blue-400/40 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]'}`}
            >
              {isSandboxOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              <span className="hidden sm:inline">Sandbox</span>
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setIsProfileMenuOpen((prev) => !prev)} className="h-9 w-9 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <User size={15} className="text-gray-200" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-xl border border-white/10 bg-[#1b1f28] shadow-2xl p-1.5 z-50">
                  <div className="px-3 py-2 text-sm text-gray-200 truncate border-b border-white/10">{userName}</div>
                  <button onClick={handleLogout} className="w-full text-left mt-1 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-white/5 transition-colors">Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar smooth-scroll">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-full max-w-3xl text-center -mt-10">
                <div className="mx-auto mb-4 h-32 w-90 md:h-36 md:w-96">
                  <img src="/temp/ui-logo.png" alt="Renzo logo" className="h-full w-full object-contain" />
                </div>
                {attachedFiles.length > 0 && (
                  <div className="mx-auto w-full max-w-[720px] mb-3 flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="relative group cursor-pointer flex flex-col items-center">
                        {file.previewDataUrl ? (
                          <img src={file.previewDataUrl} alt={file.name} className="h-20 w-20 object-cover rounded-xl border border-white/15" onClick={() => setPreviewImage(file.previewDataUrl)} />
                        ) : (
                          <div className="h-20 w-20 rounded-xl bg-[#0f1116] border border-white/10 flex items-center justify-center text-[10px] text-gray-400 px-1 text-center">{file.name}</div>
                        )}
                        <button type="button" onClick={() => removeAttachment(file.id)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-neutral-700 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <X size={10} />
                        </button>
                        <p className="mt-0.5 text-center text-[9px] text-gray-400 truncate w-20">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="mx-auto relative w-full max-w-[720px] rounded-full border border-white/15 bg-[#0f1116]/88 backdrop-blur-xl">
                  <button type="button" title="Attach files/images (Shift+click for folder)" onClick={handleAttachClick} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                    <Paperclip size={16} />
                  </button>
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder={activeChatId && !canWriteCurrentChat ? 'Read-only shared chat' : "What's on your mind?"} className="w-full bg-transparent pl-11 pr-28 py-3.5 text-[21px] leading-none text-gray-100 placeholder-gray-500 focus:outline-none" disabled={activeChatId && !canWriteCurrentChat} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button type="button" className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                      <Mic size={16} />
                    </button>
                    <button type="submit" disabled={(!inputMessage.trim() && !attachedFiles.length) || (activeChatId && !canWriteCurrentChat)} className="h-9 w-9 rounded-full bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-40 flex items-center justify-center">
                      <Send size={15} />
                    </button>
                  </div>
                </form>
                <p className="mt-6 text-[13px] text-gray-500">Renzo can make mistakes. Verify important information.</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-8 pb-40 space-y-6">
              {messages.map((msg, idx) => {
                const isOwnUserMessage = msg.senderRole === 'user' && String(msg.senderUserId || '') === String(currentUserId);

                return (
                  <div key={idx} className={`flex ${msg.senderRole === 'user' ? (isOwnUserMessage ? 'justify-end' : 'justify-start w-full') : 'justify-start w-full'}`}>
                    {msg.senderRole === 'user' ? (
                      <div className={`flex flex-col gap-1.5 max-w-[78%] ${isOwnUserMessage ? 'items-end' : 'items-start'}`}>
                        {!isOwnUserMessage && (
                          <p className="text-[11px] text-gray-500 px-1">{msg.senderName || 'Collaborator'}</p>
                        )}
                        {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div className={`flex flex-wrap gap-2 ${isOwnUserMessage ? 'justify-end' : 'justify-start'}`}>
                            {msg.attachments.map((file, fileIdx) => (
                              <div key={`${file.name}-${fileIdx}`} className="relative group cursor-pointer flex flex-col items-center">
                                {file.previewDataUrl ? (
                                  <img src={file.previewDataUrl} alt={file.name} className="h-28 w-28 object-cover rounded-xl border border-white/15 hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(file.previewDataUrl)} />
                                ) : (
                                  <div className="h-24 w-28 rounded-xl bg-[#1e2130] border border-white/10 flex items-center justify-center text-[10px] text-gray-400 px-2 text-center">{file.name}</div>
                                )}
                                <p className="mt-0.5 text-[9px] text-gray-500 truncate w-28 text-center">{file.name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 text-gray-100 text-[15px] leading-[1.7] ${isOwnUserMessage ? 'bg-[#1e2130]' : 'bg-[#141822] border border-white/10'}`}>
                          {msg.content || ''}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full group/ai">
                        <div className="text-[16px] leading-[1.9] tracking-[0.003em] text-gray-100
                          prose prose-invert max-w-none
                          prose-p:my-0 prose-p:text-gray-100 prose-p:leading-[1.9]
                          prose-headings:my-0 prose-headings:text-white prose-headings:font-semibold
                          prose-h1:text-[22px] prose-h2:text-[19px] prose-h3:text-[17px]
                          prose-ul:my-0 prose-ul:pl-0 prose-ol:my-0 prose-ol:pl-0
                          prose-li:my-0 prose-li:text-gray-100
                          prose-strong:text-white prose-strong:font-semibold
                          prose-em:text-gray-200
                          prose-hr:my-7 prose-hr:border-white/10
                          prose-blockquote:border-l-white/20 prose-blockquote:text-gray-300
                          prose-table:text-[14px] prose-th:text-gray-200 prose-td:text-gray-300
                          prose-code:text-blue-300 prose-code:text-[13.5px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                          prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-0">
                          {msg.isStreaming ? (
                            <div className="whitespace-pre-wrap break-words leading-[1.9] text-gray-100">{msg.content || ''}</div>
                          ) : (
                            <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content || ''}</ReactMarkdown>
                          )}
                        </div>
                        {!msg.isStreaming && msg.content && (
                          <div className="mt-2 opacity-0 group-hover/ai:opacity-100 transition-opacity">
                            <CopyButton text={msg.content} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start w-full">
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '140ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '280ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-5 pt-10 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="w-full max-w-3xl mx-auto">
              {attachedFiles.length > 0 && (
                <div className="mb-2 px-1 flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="relative group cursor-pointer flex flex-col items-center">
                      {file.previewDataUrl ? (
                        <img src={file.previewDataUrl} alt={file.name} className="h-20 w-20 object-cover rounded-xl border border-white/15" onClick={() => setPreviewImage(file.previewDataUrl)} />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-[#0f1116] border border-white/10 flex items-center justify-center text-[10px] text-gray-400 px-1 text-center">{file.name}</div>
                      )}
                      <button type="button" onClick={() => removeAttachment(file.id)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-neutral-700 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <X size={10} />
                      </button>
                      <p className="mt-0.5 text-center text-[9px] text-gray-400 truncate w-20">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="relative rounded-full border border-white/15 bg-[#0f1116]/90 backdrop-blur-xl">
                <button type="button" title="Attach files/images (Shift+click for folder)" onClick={handleAttachClick} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                  <Paperclip size={16} />
                </button>
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder={activeChatId && !canWriteCurrentChat ? 'Read-only shared chat' : "What's on your mind?"} className="w-full bg-transparent pl-11 pr-28 py-3.5 text-[15px] text-gray-100 placeholder-gray-500 focus:outline-none" disabled={activeChatId && !canWriteCurrentChat} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button type="button" className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                    <Mic size={16} />
                  </button>
                  <button type="submit" disabled={(!inputMessage.trim() && !attachedFiles.length) || (activeChatId && !canWriteCurrentChat)} className="h-9 w-9 rounded-full bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-40 flex items-center justify-center">
                    <Send size={15} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <InviteCollaboratorModal
        isInviteModalOpen={isInviteModalOpen}
        setIsInviteModalOpen={setIsInviteModalOpen}
        inviteError={inviteError}
        setInviteError={setInviteError}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        invitePermission={invitePermission}
        setInvitePermission={setInvitePermission}
        sendInvite={sendInvite}
        isSendingInvite={isSendingInvite}
      />

      <ImagePreviewModal previewImage={previewImage} setPreviewImage={setPreviewImage} />

      <SandboxPanel
        isSandboxOpen={isSandboxOpen}
        editorCode={editorCode}
        setEditorCode={setEditorCode}
        sandboxWidthPercent={sandboxWidthPercent}
        setSandboxWidthPercent={setSandboxWidthPercent}
      />
    </div>
  );
}
