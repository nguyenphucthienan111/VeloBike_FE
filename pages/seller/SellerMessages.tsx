import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SellerHeaderUserMenu } from '../../components/SellerHeaderUserMenu';
import { API_BASE_URL } from '../../constants';
import { handleSessionExpired } from '../../utils/auth';
import { Search, Paperclip, Send, MoreVertical, Phone, Video, Image as ImageIcon, Smile } from 'lucide-react';
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
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isFromSeller: boolean;
}

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
    isOnline: Math.random() > 0.5,
  };
}

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

export const SellerMessages: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<any>(null);

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

  useEffect(() => {
    const newSocket = io(API_BASE_URL.replace('/api', ''));
    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    const eventName = `notify_user_${currentUserId}`;
    socket.on(eventName, (data: any) => {
      if (data.type === 'NEW_MESSAGE') {
        const newMessage = data.message;
        if (selectedConversation && newMessage.conversationId === selectedConversation.conversationId) {
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage._id)) return prev;
            return [...prev, mapBeMessageToFe(newMessage, selectedConversation.sellerId)];
          });
        }
        setConversations((prev) => {
          const existingIndex = prev.findIndex(c => c.conversationId === newMessage.conversationId);
          if (existingIndex > -1) {
            const updatedConv = {
              ...prev[existingIndex],
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.createdAt,
              unreadCount: (selectedConversation?.conversationId === newMessage.conversationId) ? 0 : (prev[existingIndex].unreadCount + 1)
            };
            const newConvs = [...prev];
            newConvs.splice(existingIndex, 1);
            return [updatedConv, ...newConvs];
          } else {
            fetchConversations().then(setConversations);
            return prev;
          }
        });
      }
    });
    return () => { socket.off(eventName); };
  }, [socket, selectedConversation]);

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

  const fetchMessages = useCallback(async (conv: Conversation) => {
    if (!conv.conversationId) return;
    try {
      setLoadingMessages(true);
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
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    (async () => {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const convos = await fetchConversations();
        const uid = getCurrentUserId();
        // Không hiển thị hội thoại với chính mình (tự nhắn tin)
        const validConvos = convos.filter((c) => String(c.userId) !== String(uid));
        setConversations(validConvos);
        setFilteredConversations(validConvos);
        if (validConvos.length > 0 && !selectedConversation) {
          setSelectedConversation(validConvos[0]);
          fetchMessages(validConvos[0]);
        } else if (selectedConversation && validConvos.every((c) => c.id !== selectedConversation.id)) {
          setSelectedConversation(null);
        }
      } catch (e) {
        console.error('Error loading conversations:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      setFilteredConversations(
        conversations.filter((c) =>
          c.userName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, conversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;
    try {
      setSendingMessage(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation.conversationId,
          receiverId: selectedConversation.userId,
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
          return [...prev, mapBeMessageToFe(newMessage, selectedConversation.sellerId)];
        });
      }
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 h-full">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                {conversations.length}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-all border-l-4 ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-blue-50 border-blue-600' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100">
                      {conversation.userAvatar ? (
                        <img src={conversation.userAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-500">{conversation.userName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`text-sm truncate ${selectedConversation?.id === conversation.id ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {conversation.userName}
                      </h3>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(conversation.lastMessageTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${selectedConversation?.id === conversation.id ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {conversation.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Search size={24} />
                </div>
                <p className="text-sm">Không tìm thấy cuộc trò chuyện</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedConversation.userAvatar ? (
                      <img src={selectedConversation.userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-gray-600">{selectedConversation.userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {selectedConversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedConversation.userName}</h2>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Online
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                  <Phone size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                  <Video size={20} />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                <SellerHeaderUserMenu user={user} />
              </div>
            </div>

            {/* Messages List - FB Style */}
            <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                </div>
              ) : messages.length > 0 ? (
                <>
                  <div className="flex justify-center mb-4 mt-2">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {new Date(messages[0].createdAt).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  
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
                                {selectedConversation.userAvatar ? (
                                  <img src={selectedConversation.userAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-600">{selectedConversation.userName.charAt(0).toUpperCase()}</span>
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
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Send size={32} className="ml-1" />
                  </div>
                  <p>No messages yet. Start a conversation!</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-gray-200">
              <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
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
                    disabled={!messageInput.trim() || sendingMessage}
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
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
              <MoreVertical size={40} className="opacity-20" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Welcome to Seller Messages</h3>
            <p className="max-w-xs text-center text-sm">Select a conversation from the list on the left to start messaging customers.</p>
          </div>
        )}
      </div>
    </div>
  );
};
