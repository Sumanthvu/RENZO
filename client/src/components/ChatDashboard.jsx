import { useState, useEffect, useRef } from 'react';
import { Menu, Plus, MessageSquare, Settings, Play, User, Send, X, Code, Terminal, ChevronDown, PanelRightOpen, PanelRightClose } from 'lucide-react';
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
  const [editorCode, setEditorCode] = useState('# Code editor ready\n');
  const chatContainerRef = useRef(null);
  const profileMenuRef = useRef(null);
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

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsgContent = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { senderRole: 'user', content: userMsgContent }]);
    setIsLoading(true);

    try {
      const res = await axiosClient.post(`${chatApiBase}/send`, {
        chatId: activeChatId,
        content: userMsgContent
      });

      const { aiMessage, chatId } = res.data.data;
      setMessages(prev => [...prev, aiMessage]);
      if (!activeChatId) {
        setActiveChatId(chatId);
        fetchChats();
      }
    } catch (err) {
      console.error(err);
      const serverMessage = err?.response?.data?.message || "Unable to generate AI response right now. Please check server logs/config.";
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
    <div className="relative h-screen w-full overflow-hidden bg-[#070a12] text-white font-sans flex">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(64,124,255,0.18),transparent_35%),radial-gradient(circle_at_85%_100%,rgba(31,84,201,0.16),transparent_38%),linear-gradient(180deg,#0b1220_0%,#070a12_55%,#070a12_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-[#0b111d]/88 backdrop-blur-2xl transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold tracking-tight text-white/95">SparkShell</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"><X size={19} /></button>
        </div>

        <div className="px-4 py-4">
          <button
            onClick={() => { setActiveChatId(null); setMessages([]); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-3 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-colors"
          >
            <Plus size={17} className="text-gray-200" />
            <span className="text-sm font-medium text-gray-100">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
          <p className="px-2 mb-2 text-[11px] uppercase tracking-[0.16em] text-gray-500">Recent</p>
          <div className="space-y-1">
            {chats.map(chat => (
              <button
                key={chat._id}
                onClick={() => { setActiveChatId(chat._id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${activeChatId === chat._id ? 'bg-[#2a2f3a] text-white' : 'text-gray-300 hover:bg-white/[0.05]'}`}
              >
                <MessageSquare size={15} className={`${activeChatId === chat._id ? 'text-white' : 'text-gray-500'}`} />
                <span className="truncate text-sm">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setIsSidebarOpen(false)} />}

      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        <header className="h-16 px-4 md:px-6 border-b border-white/10 bg-[#0b111d]/70 backdrop-blur-xl flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"><Menu size={22} /></button>

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
              <div className="w-full max-w-3xl text-center">
                <div className="mx-auto mb-7 relative h-24 w-24 md:h-28 md:w-28">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
                  <div className="absolute inset-[10%] rounded-full border border-blue-300/45 bg-gradient-to-br from-blue-300/35 via-sky-300/15 to-transparent shadow-[0_0_55px_rgba(96,165,250,0.42)]" />
                  <div className="absolute inset-[28%] rounded-full bg-white/85" />
                </div>
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white/95">Ask anything</h1>
                <p className="mt-3 text-gray-300/90 text-sm md:text-base">Search, reason, and build with SparkShell.</p>
                <form onSubmit={handleSendMessage} className="mt-8 relative rounded-2xl border border-white/15 bg-[#111827]/78 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Message SparkShell..." className="w-full bg-transparent px-5 py-4 md:py-5 pr-14 text-base text-gray-100 placeholder-gray-500 focus:outline-none" />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-white/10 hover:bg-blue-600 transition-colors flex items-center justify-center">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-8 pb-40 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] md:max-w-[82%] rounded-2xl px-4 py-3.5 border backdrop-blur-md ${msg.senderRole === 'user' ? 'bg-[#233047]/85 border-blue-300/20 text-gray-100' : 'bg-[#101724]/88 border-white/10 text-gray-200'}`}>
                    <div className={`text-[15px] leading-7 prose prose-invert max-w-none prose-p:my-3 prose-headings:my-4 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-white prose-code:text-blue-300 prose-code:before:content-none prose-code:after:content-none prose-pre:my-4 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#0f141d] prose-pre:px-4 prose-pre:py-3 prose-pre:overflow-x-auto ${msg.senderRole === 'user' ? 'prose-p:text-gray-100' : 'prose-p:text-gray-200'}`}>
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 border border-white/10 bg-[#101724]/88 backdrop-blur-md text-gray-300">
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
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-5 pt-10 bg-gradient-to-t from-[#070b13]/95 via-[#070b13]/78 to-transparent">
            <div className="w-full max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="relative rounded-2xl border border-white/15 bg-[#111827]/82 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Message SparkShell..." className="w-full bg-transparent px-5 py-4 pr-14 text-[15px] text-gray-100 placeholder-gray-500 focus:outline-none" />
                <button type="submit" disabled={!inputMessage.trim()} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-white/10 hover:bg-blue-600 transition-colors disabled:opacity-40 flex items-center justify-center">
                  <Send size={16} />
                </button>
              </form>
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