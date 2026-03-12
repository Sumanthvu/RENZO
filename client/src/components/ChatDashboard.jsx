import { useState, useEffect, useRef } from 'react';
import { Menu, Plus, MessageSquare, Settings, Play, User, Send, X, Code, Terminal, PanelRightOpen, PanelRightClose, Paperclip, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

export default function ChatDashboard() {
  const navigate = useNavigate();
  const chatApiBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/users').replace('/api/users', '/api/v1/chats');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem('activeChatId'));
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [editorCode, setEditorCode] = useState('# Code editor ready\n');
  const chatContainerRef = useRef(null);
  const profileMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const userName = (() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return 'User';
      const parsedUser = JSON.parse(rawUser);
      return parsedUser?.fullName || parsedUser?.name || 'User';
    } catch {
      return 'User';
    }
  })();

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (activeChatId) fetchMessages(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    } else {
      localStorage.removeItem('activeChatId');
    }
  }, [activeChatId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const fetchChats = async () => {
    try {
      const res = await axiosClient.get(`${chatApiBase}`);
      const chatList = res.data.data || [];
      setChats(chatList);

      if (!chatList.length) {
        setActiveChatId(null);
        setMessages([]);
        return;
      }

      if (activeChatId) {
        const exists = chatList.some((chat) => chat._id === activeChatId);
        if (!exists) {
          setActiveChatId(chatList[0]._id);
        }
      }
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await axiosClient.get(`${chatApiBase}/${id}`);
      setMessages(res.data.data);
    } catch (err) { console.error(err); }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isTextLikeFile = (file) => {
    const textMimePrefixes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/x-sh',
      'application/x-httpd-php'
    ];
    const textExtensions = [
      '.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.py', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', '.xml', '.yml', '.yaml', '.env', '.sh'
    ];

    if (textMimePrefixes.some((prefix) => file.type.startsWith(prefix))) return true;
    const lowerName = file.name.toLowerCase();
    return textExtensions.some((ext) => lowerName.endsWith(ext));
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const optimizeImageDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        try {
          const maxSide = 1280;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Canvas context unavailable'));
            return;
          }

          ctx.drawImage(image, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      image.src = objectUrl;
    });

  const handleFilesPicked = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const processed = await Promise.all(
      files.map(async (file) => {
        const relativePath = file.webkitRelativePath || file.name;
        const attachment = {
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          relativePath,
          type: file.type || 'application/octet-stream',
          size: file.size,
          previewDataUrl: null,
          textContent: null,
        };

        if ((file.type || '').startsWith('image/')) {
          try {
            attachment.previewDataUrl = await optimizeImageDataUrl(file);
          } catch {
            try {
              attachment.previewDataUrl = await readFileAsDataUrl(file);
            } catch {
              attachment.previewDataUrl = null;
            }
          }
          return attachment;
        }

        if (isTextLikeFile(file)) {
          try {
            const text = await file.text();
            attachment.textContent = text.slice(0, 6000);
          } catch {
            attachment.textContent = null;
          }
        }

        return attachment;
      })
    );

    setAttachedFiles((prev) => [...prev, ...processed].slice(0, 20));
    event.target.value = '';
  };

  const handleAttachClick = (event) => {
    if (event?.shiftKey) {
      folderInputRef.current?.click();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputMessage.trim() && !attachedFiles.length) || isLoading) return;

    const userMsgContent = inputMessage.trim() || 'Please analyze the attached files/images.';
    const attachmentPayload = attachedFiles.map(({ id, ...rest }) => rest);

    setInputMessage('');
    setAttachedFiles([]);
    setMessages(prev => [...prev, { senderRole: 'user', content: userMsgContent, attachments: attachmentPayload }]);
    setIsLoading(true);

    try {
      const res = await axiosClient.post(`${chatApiBase}/send`, {
        chatId: activeChatId,
        content: userMsgContent,
        attachments: attachmentPayload,
      });

      const { aiMessage, chatId } = res.data.data;
      setMessages(prev => [...prev, aiMessage]);
      if (!activeChatId) {
        setActiveChatId(chatId);
        fetchChats();
      }
    } catch (err) {
      console.error(err);
      const serverMessage = err?.response?.status === 413
        ? "Uploaded file is too large for current limit. Please upload a smaller image/file."
        : err?.response?.data?.message || "Unable to generate AI response right now. Please check server logs/config.";
      setMessages(prev => [
        ...prev,
        {
          senderRole: 'ai',
          content: `⚠️ ${serverMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post('logout');
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('activeChatId');
      navigate('/login');
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white font-sans flex">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(72,96,145,0.14),transparent_38%),linear-gradient(180deg,#040507_0%,#020203_100%)]" />
      </div>

      <div className="fixed inset-y-0 left-0 z-50 w-12 border-r border-white/10 bg-black/90 backdrop-blur-xl flex flex-col items-center py-4">
        <button className="h-9 w-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 flex items-center justify-center transition-colors" onClick={() => setIsSidebarOpen((prev) => !prev)}>
          <Menu size={20} />
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-12 z-40 w-[300px] transform border-r border-white/10 bg-[#0c0e13]/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-xl font-semibold tracking-tight text-white/95">Renzo</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"><X size={18} /></button>
        </div>

        <div className="px-3 pt-3 space-y-1.5">
          <button
            onClick={() => { setActiveChatId(null); setMessages([]); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-colors"
          >
            <Plus size={17} className="text-gray-200" />
            <span className="text-sm font-medium text-gray-100">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4 no-scrollbar smooth-scroll">
          <p className="px-2 mb-2 text-[11px] uppercase tracking-[0.16em] text-gray-500">Your chats</p>
          <div className="space-y-1">
            {chats.map(chat => (
              <button
                key={chat._id}
                onClick={() => { setActiveChatId(chat._id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${activeChatId === chat._id ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/[0.05]'}`}
              >
                <MessageSquare size={15} className={`${activeChatId === chat._id ? 'text-white' : 'text-gray-500'}`} />
                <span className="truncate text-sm">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>

      </aside>

      {isSidebarOpen && <div className="fixed inset-y-0 right-0 left-12 z-30 bg-black/45" onClick={() => setIsSidebarOpen(false)} />}

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

        <header className="h-14 px-4 md:px-6 border-b border-white/10 bg-black/55 backdrop-blur-xl flex items-center justify-end">

          <div className="flex items-center gap-2.5">
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

        <main ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-full max-w-3xl text-center -mt-10">
                <div className="mx-auto mb-8 h-24 w-64 md:h-28 md:w-80">
                  <img src="/temp/ui-logo.png" alt="Renzo logo" className="h-full w-full object-contain" />
                </div>
                <form onSubmit={handleSendMessage} className="mx-auto mt-2 relative w-full max-w-[720px] rounded-full border border-white/15 bg-[#0f1116]/88 backdrop-blur-xl">
                  <button type="button" title="Attach files/images (Shift+click for folder)" onClick={handleAttachClick} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                    <Paperclip size={16} />
                  </button>
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="What's on your mind?" className="w-full bg-transparent pl-11 pr-28 py-3.5 text-[21px] leading-none text-gray-100 placeholder-gray-500 focus:outline-none" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button type="button" className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                      <Mic size={16} />
                    </button>
                    <button type="submit" className="h-9 w-9 rounded-full bg-white text-black hover:bg-gray-200 transition-colors flex items-center justify-center">
                      <Send size={15} />
                    </button>
                  </div>
                </form>
                {attachedFiles.length > 0 && (
                  <div className="mt-3 mx-auto w-full max-w-[720px] flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 w-[168px]">
                        {file.previewDataUrl ? (
                          <img src={file.previewDataUrl} alt={file.name} className="h-20 w-full rounded-lg object-cover" />
                        ) : (
                          <div className="h-20 w-full rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs text-gray-400 px-2 text-center">
                            {file.name}
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-gray-300 truncate" title={file.relativePath}>{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-6 text-[13px] text-gray-500">Renzo can make mistakes. Verify important information.</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-8 pb-40 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] md:max-w-[82%] rounded-2xl px-4 py-3.5 border backdrop-blur-md ${msg.senderRole === 'user' ? 'bg-[#171b26] border-white/10 text-gray-100' : 'bg-[#0f1116] border-white/10 text-gray-200'}`}>
                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {msg.attachments.map((file, fileIdx) => (
                          <div key={`${file.name}-${fileIdx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 w-[168px]">
                            {file.previewDataUrl ? (
                              <img src={file.previewDataUrl} alt={file.name} className="h-20 w-full rounded-lg object-cover" />
                            ) : (
                              <div className="h-20 w-full rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs text-gray-400 px-2 text-center">
                                {file.name}
                              </div>
                            )}
                            <p className="mt-1 text-[11px] text-gray-300 truncate" title={file.relativePath || file.name}>{file.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`text-[15px] leading-7 prose prose-invert max-w-none prose-p:my-3 prose-headings:my-4 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-white prose-code:text-blue-300 prose-code:before:content-none prose-code:after:content-none prose-pre:my-4 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#0f141d] prose-pre:px-4 prose-pre:py-3 prose-pre:overflow-x-auto ${msg.senderRole === 'user' ? 'prose-p:text-gray-100' : 'prose-p:text-gray-200'}`}>
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.content || ''}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 border border-white/10 bg-[#0f1116] backdrop-blur-md text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '140ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '280ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-5 pt-10 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="w-full max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="relative rounded-full border border-white/15 bg-[#0f1116]/90 backdrop-blur-xl">
                <button type="button" title="Attach files/images (Shift+click for folder)" onClick={handleAttachClick} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                  <Paperclip size={16} />
                </button>
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="What's on your mind?" className="w-full bg-transparent pl-11 pr-28 py-3.5 text-[15px] text-gray-100 placeholder-gray-500 focus:outline-none" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button type="button" className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                    <Mic size={16} />
                  </button>
                  <button type="submit" disabled={!inputMessage.trim()} className="h-9 w-9 rounded-full bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-40 flex items-center justify-center">
                    <Send size={15} />
                  </button>
                </div>
              </form>
              {attachedFiles.length > 0 && (
                <div className="mt-2 px-1 flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 w-[150px]">
                      {file.previewDataUrl ? (
                        <img src={file.previewDataUrl} alt={file.name} className="h-16 w-full rounded-lg object-cover" />
                      ) : (
                        <div className="h-16 w-full rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-[10px] text-gray-400 px-2 text-center">
                          {file.name}
                        </div>
                      )}
                      <p className="mt-1 text-[10px] text-gray-300 truncate" title={file.relativePath}>{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}