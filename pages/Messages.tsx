import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { handleSessionExpired } from '../utils/auth';
import { io } from 'socket.io-client';

interface Conversation {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  sellerId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isFromSeller: boolean;
}

/** BE: GET /conversations → { _id, buyerId, sellerId, listingId, lastMessage, lastMessageAt } */
function mapBeConversationToFe(c: any, currentUserId: string): Conversation {
  const buyer = c.buyerId;
  const seller = c.sellerId;
  const isCurrentBuyer = String(buyer?._id) === currentUserId;
  const other = isCurrentBuyer ? seller : buyer;
  return {
    id: c._id,
    conversationId: c._id,
    userId: other?._id,
    userName: other?.fullName || 'Unknown',
    userAvatar: other?.avatar,
    sellerId: seller?._id,
    lastMessage: c.lastMessage || '',
    lastMessageTime: c.lastMessageAt || c.createdAt || '',
    unreadCount: 0,
  };
}

/** BE: GET /list/:conversationId → messages with senderId populated */
function mapBeMessageToFe(m: any, sellerId: string): Message {
  const senderId = m.senderId?._id ?? m.senderId;
  return {
    id: m._id,
    senderId,
    senderName: m.senderId?.fullName || 'Unknown',
    content: m.content,
    createdAt: m.createdAt,
    isFromSeller: String(senderId) === String(sellerId),
  };
}

/** Trang tin nhắn chung: cho Buyer và cho Seller (khi xem từ header). Một inbox thống nhất. */
export const Messages: React.FC = () => {
  const [searchParams] = useSearchParams();
  const contactFromUrl = searchParams.get('contact');
  const listingIdFromUrl = searchParams.get('listingId');
  const orderIdFromUrl = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u?._id || u?.id || '';
    } catch {
      return '';
    }
  };

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return [];
    const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleSessionExpired();
      return [];
    }
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.data || [];
    const uid = getCurrentUserId();
    return raw.map((c: any) => mapBeConversationToFe(c, uid));
  }, []);

  // Socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL.replace('/api', ''));
    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  // Listen for global user notifications
  useEffect(() => {
    if (!socket) return;
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    const eventName = `notify_user_${currentUserId}`;
    socket.on(eventName, (data: any) => {
      if (data.type === 'NEW_MESSAGE') {
        const newMessage = data.message;
        
        // 1. Update messages list if viewing this conversation
        if (selected && newMessage.conversationId === selected.conversationId) {
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage._id)) return prev;
            return [...prev, mapBeMessageToFe(newMessage, selected.sellerId)];
          });
        }

        // 2. Update conversation list
        setConversations((prev) => {
          const existingIndex = prev.findIndex(c => c.conversationId === newMessage.conversationId);
          if (existingIndex > -1) {
            const updatedConv = {
              ...prev[existingIndex],
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.createdAt,
              unreadCount: (selected?.conversationId === newMessage.conversationId) ? 0 : (prev[existingIndex].unreadCount + 1)
            };
            const newConvs = [...prev];
            newConvs.splice(existingIndex, 1);
            return [updatedConv, ...newConvs];
          } else {
            fetchConversations().then((raw) => {
              const uid = getCurrentUserId();
              const filtered = raw.filter((c) => String(c.userId) !== String(uid));
              setConversations(filtered);
              setSelected((prev) =>
                prev && filtered.some((c) => c.conversationId === prev.conversationId)
                  ? prev
                  : (filtered[0] ?? null)
              );
            });
            return prev;
          }
        });
      }
    });

    return () => { socket.off(eventName); };
  }, [socket, selected, fetchConversations]);

  const ensureConversationWithContact = useCallback(async (
    contactUserId: string,
    listingId?: string | null,
    orderId?: string | null
  ): Promise<Conversation | null> => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return null;
    const uid = getCurrentUserId();
    if (!uid) return null;

    const params = new URLSearchParams();
    if (listingId) params.set('listingId', listingId);
    if (orderId) params.set('orderId', orderId);
    const qs = params.toString();
    const url = `${API_BASE_URL}/messages/conversation/${contactUserId}${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      handleSessionExpired();
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const conv = data.data;
    if (!conv) return null;
    return mapBeConversationToFe(conv, uid);
  }, []);

  const fetchMessages = useCallback(async (conv: Conversation) => {
    if (!conv.conversationId) return;
    try {
      setMessagesLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/messages/list/${conv.conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const raw = data.data || [];
        setMessages(raw.map((m: any) => mapBeMessageToFe(m, conv.sellerId)));
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const convos = await fetchConversations();
        if (cancelled) return;
        const uid = getCurrentUserId();
        const validConvos = convos.filter((c) => String(c.userId) !== String(uid));
        setConversations(validConvos);

        if (contactFromUrl) {
          const ensured = await ensureConversationWithContact(
            contactFromUrl,
            listingIdFromUrl,
            orderIdFromUrl
          );
          if (cancelled || !ensured) {
            if (validConvos.length > 0 && !selected) {
              setSelected(validConvos[0]);
              fetchMessages(validConvos[0]);
            }
            setLoading(false);
            return;
          }
          if (String(ensured.userId) === String(uid)) {
            if (validConvos.length > 0 && !selected) {
              setSelected(validConvos[0]);
              fetchMessages(validConvos[0]);
            }
            setLoading(false);
            return;
          }
          const exists = validConvos.find(c => c.conversationId === ensured.conversationId);
          const toSelect = exists || { ...ensured };
          if (!exists) {
            setConversations(prev => [toSelect, ...prev]);
          }
          setSelected(toSelect);
          await fetchMessages(toSelect);
          const baseHash = window.location.hash.split('?')[0];
          window.history.replaceState({}, '', `${window.location.pathname}${baseHash || '#/messages'}`);
        } else if (validConvos.length > 0 && !selected) {
          setSelected(validConvos[0]);
          fetchMessages(validConvos[0]);
        }
      } catch (e) {
        console.error('Error loading messages:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contactFromUrl, listingIdFromUrl, orderIdFromUrl]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selected || sending) return;
    try {
      setSending(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selected.conversationId,
          receiverId: selected.userId,
          content: messageInput.trim(),
        }),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const newMessage = data.data;
        setMessageInput('');
        setMessages((prev) => {
          if (prev.some(m => m.id === newMessage._id)) return prev;
          return [...prev, mapBeMessageToFe(newMessage, selected.sellerId)];
        });
      }
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin h-10 w-10 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}>
        <div className="flex flex-1 min-h-0">
          <div className="w-64 sm:w-72 border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      fetchMessages(c);
                    }}
                    className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-gray-100' : ''}`}
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{c.userName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage || '(No messages yet)'}</p>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center mt-1 bg-accent text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 px-1">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a chat from listing or order pages.</p>
                </div>
              )}
            </div>
          </div>

          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{selected.userName}</p>
                  <p className="text-xs text-gray-500">
                    {selected.sellerId === selected.userId ? 'Seller' : 'Buyer'}
                  </p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {messagesLoading ? (
                  <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
                ) : messages.length > 0 ? (
                  <>
                  {messages.map((message, index) => {
                    const currentUserId = getCurrentUserId();
                    const isMe = String(message.senderId) === String(currentUserId);
                    const prevMessage = messages[index - 1];
                    const nextMessage = messages[index + 1];
                    
                    // Logic to determine grouping
                    const isFirstInGroup = !prevMessage || String(prevMessage.senderId) !== String(message.senderId);
                    const isLastInGroup = !nextMessage || String(nextMessage.senderId) !== String(message.senderId);
                    const isMiddleInGroup = !isFirstInGroup && !isLastInGroup;

                    // Show avatar only for the last message in a group from the other person
                    const showAvatar = !isMe && isLastInGroup;
                    
                    // Show timestamp only for the last message in a group
                    const showTimestamp = isLastInGroup;

                    // Dynamic Border Radius
                    let borderRadiusClass = 'rounded-2xl';
                    if (isMe) {
                      if (isFirstInGroup && !isLastInGroup) borderRadiusClass = 'rounded-2xl rounded-br-sm';
                      else if (isMiddleInGroup) borderRadiusClass = 'rounded-2xl rounded-r-sm';
                      else if (isLastInGroup && !isFirstInGroup) borderRadiusClass = 'rounded-2xl rounded-tr-sm';
                    } else {
                      if (isFirstInGroup && !isLastInGroup) borderRadiusClass = 'rounded-2xl rounded-bl-sm';
                      else if (isMiddleInGroup) borderRadiusClass = 'rounded-2xl rounded-l-sm';
                      else if (isLastInGroup && !isFirstInGroup) borderRadiusClass = 'rounded-2xl rounded-tl-sm';
                    }

                    // Margin bottom logic
                    const marginBottom = isLastInGroup ? 'mb-4' : 'mb-0.5';

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${marginBottom} group`}
                      >
                        {!isMe && (
                          <div className="w-8 flex-shrink-0 flex items-end">
                            {showAvatar ? (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {selected.userAvatar ? (
                                  <img src={selected.userAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-600">{selected.userName.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                            ) : (
                              <div className="w-8" /> // Placeholder to keep alignment
                            )}
                          </div>
                        )}
                        
                        <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end ml-auto' : 'items-start mr-auto'}`}>
                          {/* Tooltip timestamp on hover could be added here */}
                          <div
                            className={`px-4 py-2 text-[15px] leading-relaxed ${borderRadiusClass} ${
                              isMe
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900 border border-transparent'
                            }`}
                            title={new Date(message.createdAt).toLocaleString()}
                          >
                            <p>{message.content}</p>
                          </div>
                          {showTimestamp && (
                            <p className={`text-[10px] text-gray-400 mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                              {new Date(message.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">No messages yet. Say hello to start.</p>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                  <div className="flex gap-1 pb-2 pl-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <Paperclip size={20} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <ImageIcon size={20} />
                    </button>
                  </div>
                  
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        if (e.nativeEvent.isComposing) return;
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 max-h-32 text-sm text-gray-800 placeholder-gray-400"
                    rows={1}
                    style={{ minHeight: '44px' }}
                  />
                  
                  <div className="flex gap-1 pb-2 pr-2">
                    <button className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors">
                      <Smile size={20} />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sending}
                      className={`p-2 rounded-full transition-all ${
                        messageInput.trim() 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform hover:scale-105' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-6">
              <p className="text-sm">Select a conversation or start from a listing page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
