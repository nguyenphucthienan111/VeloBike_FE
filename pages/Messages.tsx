import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { handleSessionExpired } from '../utils/auth';

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
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

/** Trang tin nhắn chung: cho Buyer và cho Seller (khi xem từ header). Một inbox thống nhất. */
export const Messages: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const convos = data.data || [];
        setConversations(convos);
        if (convos.length > 0) {
          setSelected(convos[0]);
          fetchMessages(convos[0].userId);
        }
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      setMessagesLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selected) return;
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
        body: JSON.stringify({ receiverId: selected.userId, content: messageInput.trim() }),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        setMessageInput('');
        await fetchMessages(selected.userId);
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
        <p className="text-gray-500">Đang tải tin nhắn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Tin nhắn</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: '480px' }}>
        <div className="flex flex-1 min-h-0">
          <div className="w-64 sm:w-72 border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Cuộc trò chuyện</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      fetchMessages(c.userId);
                    }}
                    className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-gray-100' : ''}`}
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{c.userName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
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
                  <p className="text-sm">Chưa có cuộc trò chuyện</p>
                  <p className="text-xs mt-1">Liên hệ từ trang chi tiết xe hoặc đơn hàng.</p>
                </div>
              )}
            </div>
          </div>

          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                <p className="font-semibold text-gray-900">{selected.userName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <p className="text-sm text-gray-500 text-center py-4">Đang tải...</p>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isFromSeller ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          msg.isFromSeller
                            ? 'bg-gray-100 text-gray-900 border border-gray-200'
                            : 'bg-gray-900 text-white'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.isFromSeller ? 'text-gray-500' : 'text-gray-300'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">Chưa có tin nhắn. Hãy gửi lời chào.</p>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-6">
              <p className="text-sm">Chọn một cuộc trò chuyện hoặc liên hệ từ trang xe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
