import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import { getSocket, disconnectSocket } from '../socket/socketClient';

export default function useChatDashboardLogic() {
  const navigate = useNavigate();
  const chatApiBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/users').replace('/api/users', '/api/v1/chats');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState('owned');
  const [isNewChatDraft, setIsNewChatDraft] = useState(false);
  const [chats, setChats] = useState([]);
  const [sharedChats, setSharedChats] = useState([]);
  const [inboxInvites, setInboxInvites] = useState([]);
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem('activeChatId'));
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('read');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [editorCode, setEditorCode] = useState('// JavaScript sandbox\n');

  const chatContainerRef = useRef(null);
  const profileMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);
  const typingQueueRef = useRef([]);
  const typingIntervalRef = useRef(null);
  const pendingAiDoneRef = useRef(null);
  const activeStreamRef = useRef({ chatId: null, clientRequestId: null });
  const messageFetchSeqRef = useRef(0);
  const socketResponseReceivedRef = useRef(false);
  const sendFallbackTimerRef = useRef(null);

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

  const currentUserId = (() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return '';
      const parsed = JSON.parse(rawUser);
      return parsed?._id || parsed?.id || '';
    } catch {
      return '';
    }
  })();

  const isInboxView = sidebarView === 'inbox';
  const isSharedView = sidebarView === 'shared';
  const isOwnedView = sidebarView === 'owned';

  const allChats = [...chats, ...sharedChats];
  const activeChatMeta = allChats.find((item) => item._id === activeChatId);
  const canWriteCurrentChat = activeChatMeta
    ? activeChatMeta.accessLevel === 'owner' || activeChatMeta.accessLevel === 'write'
    : true;
  const canManageCollaborators = activeChatMeta?.accessLevel === 'owner';

  const stopTypingLoop = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const clearSendFallbackTimer = () => {
    if (sendFallbackTimerRef.current) {
      clearTimeout(sendFallbackTimerRef.current);
      sendFallbackTimerRef.current = null;
    }
  };

  const fetchChats = async () => {
    try {
      const res = await axiosClient.get(`${chatApiBase}`);
      const chatList = res.data.data || [];
      setChats(chatList);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSharedChats = async () => {
    try {
      const res = await axiosClient.get(`${chatApiBase}/shared`);
      const sharedList = res.data.data || [];
      setSharedChats(sharedList);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInboxInvites = async () => {
    try {
      const res = await axiosClient.get(`${chatApiBase}/invitations/inbox`);
      setInboxInvites(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshChatLists = async () => {
    await Promise.all([fetchChats(), fetchSharedChats(), fetchInboxInvites()]);
  };

  const finalizeAiMessage = ({ aiMessage, chatId }) => {
    if (
      activeChatIdRef.current &&
      chatId &&
      String(chatId) !== String(activeChatIdRef.current)
    ) {
      setIsLoading(false);
      pendingAiDoneRef.current = null;
      if (activeStreamRef.current?.chatId && String(activeStreamRef.current.chatId) === String(chatId)) {
        activeStreamRef.current = { chatId: null, clientRequestId: null };
      }
      return;
    }

    setMessages((prev) => {
      const updated = [...prev];
      const idx = updated.findLastIndex((m) => m.isStreaming);
      if (idx >= 0) {
        updated[idx] = { ...aiMessage, isStreaming: false };
        return updated;
      }

      return [...updated, aiMessage];
    });

    if (!activeChatIdRef.current) {
      setActiveChatId(chatId);
      fetchChats();
    }

    setIsLoading(false);
    pendingAiDoneRef.current = null;
    activeStreamRef.current = { chatId: null, clientRequestId: null };
  };

  const flushTypingQueue = () => {
    if (!typingQueueRef.current.length) {
      stopTypingLoop();
      if (pendingAiDoneRef.current) {
        finalizeAiMessage(pendingAiDoneRef.current);
      }
      return;
    }

    const batchSize = typingQueueRef.current.length > 260
      ? 14
      : typingQueueRef.current.length > 140
        ? 8
        : typingQueueRef.current.length > 60
          ? 4
          : 2;

    const nextSlice = typingQueueRef.current.splice(0, batchSize).join('');

    setMessages((prev) => {
      const idx = prev.findLastIndex((m) => m.isStreaming);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          content: `${updated[idx].content || ''}${nextSlice}`,
        };
        return updated;
      }

      return [...prev, { senderRole: 'ai', content: nextSlice, isStreaming: true }];
    });
  };

  const ensureTypingLoop = () => {
    if (typingIntervalRef.current) return;

    typingIntervalRef.current = setInterval(() => {
      flushTypingQueue();
    }, 32);
  };

  const fetchMessages = async (id) => {
    const fetchSeq = ++messageFetchSeqRef.current;
    try {
      const res = await axiosClient.get(`${chatApiBase}/${id}`);
      if (fetchSeq !== messageFetchSeqRef.current) return;
      if (String(activeChatIdRef.current) !== String(id)) return;
      setMessages(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendInvite = async () => {
    if (!activeChatId || !inviteEmail.trim() || !canManageCollaborators || isSendingInvite) return;

    setIsSendingInvite(true);
    setInviteError('');
    try {
      await axiosClient.post(`${chatApiBase}/${activeChatId}/invitations`, {
        email: inviteEmail.trim(),
        permission: invitePermission,
      });
      toast.success('Request sent successfully');
      setInviteEmail('');
      setInvitePermission('read');
      setInviteError('');
      setIsInviteModalOpen(false);
    } catch (err) {
      console.error(err);
      const serverMessage = err?.response?.data?.message || 'Failed to send invitation.';
      setInviteError(serverMessage);
    } finally {
      setIsSendingInvite(false);
    }
  };

  const respondToInvite = async (inviteId, action) => {
    try {
      await axiosClient.post(`${chatApiBase}/invitations/${inviteId}/respond`, { action });
      await refreshChatLists();
    } catch (err) {
      console.error(err);
    }
  };

  const isTextLikeFile = (file) => {
    const textMimePrefixes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/x-sh',
      'application/x-httpd-php',
    ];
    const textExtensions = [
      '.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.py', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', '.xml', '.yml', '.yaml', '.env', '.sh',
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
      }),
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

  const removeAttachment = (id) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if ((!inputMessage.trim() && !attachedFiles.length) || isLoading) return;

    if (activeChatId && !canWriteCurrentChat) {
      setMessages((prev) => [
        ...prev,
        {
          senderRole: 'ai',
          content: '⚠️ This shared chat is read-only for you. Ask the owner for write access.',
        },
      ]);
      return;
    }

    const userMsgContent = inputMessage.trim() || 'Please analyze the attached files/images.';
    const attachmentPayload = attachedFiles.map(({ id, ...rest }) => rest);
    const clientRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setInputMessage('');
    setAttachedFiles([]);
    typingQueueRef.current = [];
    pendingAiDoneRef.current = null;
    activeStreamRef.current = {
      chatId: activeChatId || null,
      clientRequestId,
    };
    stopTypingLoop();

    setMessages((prev) => [
      ...prev,
      {
        senderRole: 'user',
        senderUserId: currentUserId,
        senderName: userName,
        content: userMsgContent,
        attachments: attachmentPayload,
      },
    ]);
    setIsLoading(true);
    socketResponseReceivedRef.current = false;

    clearSendFallbackTimer();
    sendFallbackTimerRef.current = setTimeout(async () => {
      if (socketResponseReceivedRef.current) return;

      try {
        const res = await axiosClient.post(`${chatApiBase}/send`, {
          chatId: activeChatId,
          content: userMsgContent,
          attachments: attachmentPayload,
        });

        const payload = res?.data?.data || {};
        const aiMessage = payload?.aiMessage;
        const resolvedChatId = payload?.chatId;

        if (resolvedChatId && !activeChatIdRef.current) {
          setActiveChatId(resolvedChatId);
        }

        if (aiMessage) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.senderRole === 'ai' && last?.isStreaming) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...aiMessage, isStreaming: false };
              return updated;
            }
            return [...prev, aiMessage];
          });
        }

        setIsLoading(false);
        activeStreamRef.current = { chatId: null, clientRequestId: null };
        fetchChats();
        fetchSharedChats();
      } catch (err) {
        const serverMessage = err?.response?.data?.message || 'Failed to generate AI response.';
        setMessages((prev) => [
          ...prev,
          {
            senderRole: 'ai',
            content: `⚠️ ${serverMessage}`,
          },
        ]);
        setIsLoading(false);
        activeStreamRef.current = { chatId: null, clientRequestId: null };
      }
    }, 8000);

    const sock = getSocket();
    sock.emit('send_message', {
      chatId: activeChatId,
      content: userMsgContent,
      attachments: attachmentPayload,
      clientRequestId,
    });
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post('logout');
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('activeChatId');
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchChats();
    fetchSharedChats();
    fetchInboxInvites();
  }, []);

  useEffect(() => {
    typingQueueRef.current = [];
    pendingAiDoneRef.current = null;
    stopTypingLoop();
    setIsLoading(false);

    if (activeChatId) {
      setMessages([]);
      fetchMessages(activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    const sock = getSocket();
    sock.emit('join_chat', { chatId: activeChatId });
  }, [activeChatId]);

  useEffect(() => {
    if (activeChatId) {
      setIsNewChatDraft(false);
      localStorage.setItem('activeChatId', activeChatId);
    } else {
      localStorage.removeItem('activeChatId');
    }
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (activeChatId || isNewChatDraft) return;
    if (chats.length) {
      setActiveChatId(chats[0]._id);
      return;
    }
    if (sharedChats.length) {
      setActiveChatId(sharedChats[0]._id);
    }
  }, [activeChatId, chats, sharedChats, isNewChatDraft]);

  useEffect(() => {
    const sock = getSocket();
    sock.connect();

    const onChatCreated = ({ chatId }) => {
      setIsNewChatDraft(false);
      setActiveChatId(chatId);
      if (!activeStreamRef.current.chatId) {
        activeStreamRef.current = {
          ...activeStreamRef.current,
          chatId,
        };
      }
      fetchChats();
    };

    const onChatMessageCreated = ({ chatId, message }) => {
      if (!message?._id || !chatId) return;

      if (String(chatId) === String(activeChatIdRef.current)) {
        setMessages((prev) => {
          const exists = prev.some((item) => String(item?._id) === String(message._id));
          if (exists) return prev;
          return [...prev, message];
        });
      }

      fetchChats();
      fetchSharedChats();
    };

    const onInboxUpdated = () => {
      fetchInboxInvites();
    };

    const onSharedChatsUpdated = () => {
      fetchSharedChats();
      fetchChats();
    };

    const onChatUpdated = () => {
      fetchChats();
      fetchSharedChats();
    };

    const onAiChunk = ({ text, chatId, clientRequestId }) => {
      const stream = activeStreamRef.current;
      const sameActiveChat = chatId && String(chatId) === String(activeChatIdRef.current);
      const sameRequest =
        !stream?.clientRequestId ||
        !clientRequestId ||
        stream.clientRequestId === clientRequestId;

      if (!sameActiveChat || !sameRequest) return;

      socketResponseReceivedRef.current = true;
      clearSendFallbackTimer();

      setIsLoading(false);
      typingQueueRef.current.push(...Array.from(text || ''));
      ensureTypingLoop();
    };

    const onAiDone = ({ aiMessage, chatId, clientRequestId }) => {
      const stream = activeStreamRef.current;
      const sameActiveChat = chatId && String(chatId) === String(activeChatIdRef.current);
      const sameRequest =
        !stream?.clientRequestId ||
        !clientRequestId ||
        stream.clientRequestId === clientRequestId;

      if (!sameActiveChat || !sameRequest) return;

      socketResponseReceivedRef.current = true;
      clearSendFallbackTimer();

      if (typingQueueRef.current.length || typingIntervalRef.current) {
        pendingAiDoneRef.current = { aiMessage, chatId };
      } else {
        finalizeAiMessage({ aiMessage, chatId });
      }
    };

    const onAiError = ({ error, chatId, clientRequestId }) => {
      const stream = activeStreamRef.current;
      const sameActiveChat = !chatId || String(chatId) === String(activeChatIdRef.current);
      const sameRequest =
        !stream?.clientRequestId ||
        !clientRequestId ||
        stream.clientRequestId === clientRequestId;

      if (!sameActiveChat || !sameRequest) return;

      socketResponseReceivedRef.current = true;
      clearSendFallbackTimer();

      typingQueueRef.current = [];
      pendingAiDoneRef.current = null;
      stopTypingLoop();
      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findLastIndex((item) => item.isStreaming);
        if (idx >= 0) {
          updated[idx] = {
            senderRole: 'ai',
            content: `⚠️ ${error || 'Failed to generate AI response.'}`,
            isStreaming: false,
          };
        } else {
          updated.push({
            senderRole: 'ai',
            content: `⚠️ ${error || 'Failed to generate AI response.'}`,
          });
        }
        return updated;
      });
      setIsLoading(false);
      activeStreamRef.current = { chatId: null, clientRequestId: null };
    };

    sock.on('chat_created', onChatCreated);
    sock.on('chat_message_created', onChatMessageCreated);
    sock.on('inbox_updated', onInboxUpdated);
    sock.on('shared_chats_updated', onSharedChatsUpdated);
    sock.on('chat_updated', onChatUpdated);
    sock.on('ai_chunk', onAiChunk);
    sock.on('ai_done', onAiDone);
    sock.on('ai_error', onAiError);

    return () => {
      sock.off('chat_created', onChatCreated);
      sock.off('chat_message_created', onChatMessageCreated);
      sock.off('inbox_updated', onInboxUpdated);
      sock.off('shared_chats_updated', onSharedChatsUpdated);
      sock.off('chat_updated', onChatUpdated);
      sock.off('ai_chunk', onAiChunk);
      sock.off('ai_done', onAiDone);
      sock.off('ai_error', onAiError);
      typingQueueRef.current = [];
      pendingAiDoneRef.current = null;
      activeStreamRef.current = { chatId: null, clientRequestId: null };
      stopTypingLoop();
      clearSendFallbackTimer();
      disconnectSocket();
    };
  }, []);

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

  return {
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
  };
}
