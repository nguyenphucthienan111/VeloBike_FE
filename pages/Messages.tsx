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

type TabType = 'buyer' | 'seller';

export const Messages: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('buyer');

  // Buyer section state
  const [buyerLoading, setBuyerLoading] = useState(true);
  const [buyerConversations, setBuyerConversations] = useState<Conversation[]>([]);
  const [buyerSelected, setBuyerSelected] = useState<Conversation | null>(null);
  const [buyerMessages, setBuyerMessages] = useState<Message[]>([]);
  const [buyerInput, setBuyerInput] = useState('');
  const [buyerSending, setBuyerSending] = useState(false);
  const [buyerMessagesLoading, setBuyerMessagesLoading] = useState(false);

  // Seller section state
  const [sellerLoading, setSellerLoading] = useState(true);
  const [sellerConversations, setSellerConversations] = useState<Conversation[]>([]);
  const [sellerSelected, setSellerSelected] = useState<Conversation | null>(null);
  const [sellerMessages, setSellerMessages] = useState<Message[]>([]);
  const [sellerInput, setSellerInput] = useState('');
  const [sellerSending, setSellerSending] = useState(false);
  const [sellerMessagesLoading, setSellerMessagesLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchBuyerConversations();
  }, []);

  useEffect(() => {
    if (userRole === 'SELLER') {
      fetchSellerConversations();
    }
  }, [userRole]);

  const fetchBuyerConversations = async () => {
    try {
      setBuyerLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setBuyerLoading(false);
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
        setBuyerConversations(convos);
        if (convos.length > 0) {
          setBuyerSelected(convos[0]);
          fetchMessagesFor(convos[0].userId, 'buyer');
        }
      }
    } catch (e) {
      console.error('Error fetching buyer conversations:', e);
    } finally {
      setBuyerLoading(false);
    }
  };

  const fetchSellerConversations = async () => {
    try {
      setSellerLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSellerLoading(false);
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
        setSellerConversations(convos);
        if (convos.length > 0) {
          setSellerSelected(convos[0]);
          fetchMessagesFor(convos[0].userId, 'seller');
        }
      }
    } catch (e) {
      console.error('Error fetching seller conversations:', e);
    } finally {
      setSellerLoading(false);
    }
  };

  const fetchMessagesFor = async (userId: string, section: TabType) => {
    try {
      if (section === 'buyer') setBuyerMessagesLoading(true);
      else setSellerMessagesLoading(true);
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
        if (section === 'buyer') setBuyerMessages(data.data || []);
        else setSellerMessages(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      if (section === 'buyer') setBuyerMessagesLoading(false);
      else setSellerMessagesLoading(false);
    }
  };

  const sendMessage = async (section: TabType) => {
    const isBuyer = section === 'buyer';
    const selected = isBuyer ? buyerSelected : sellerSelected;
    const input = isBuyer ? buyerInput : sellerInput;
    const setInput = isBuyer ? setBuyerInput : setSellerInput;
    const setSending = isBuyer ? setBuyerSending : setSellerSending;
    if (!input.trim() || !selected) return;
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
        body: JSON.stringify({ receiverId: selected.userId, content: input.trim() }),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        setInput('');
        await fetchMessagesFor(selected.userId, section);
      }
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  const showTabs = userRole === 'SELLER';
  const loading = showTabs ? (activeTab === 'buyer' ? buyerLoading : sellerLoading) : buyerLoading;
  const conversations = showTabs ? (activeTab === 'buyer' ? buyerConversations : sellerConversations) : buyerConversations;
  const selected = showTabs ? (activeTab === 'buyer' ? buyerSelected : sellerSelected) : buyerSelected;
  const messages = showTabs ? (activeTab === 'buyer' ? buyerMessages : sellerMessages) : buyerMessages;
  const messageInput = showTabs ? (activeTab === 'buyer' ? buyerInput : sellerInput) : buyerInput;
  const setMessageInput = showTabs ? (activeTab === 'buyer' ? setBuyerInput : setSellerInput) : setBuyerInput;
  const sending = showTabs ? (activeTab === 'buyer' ? buyerSending : sellerSending) : buyerSending;
  const messagesLoading = showTabs ? (activeTab === 'buyer' ? buyerMessagesLoading : sellerMessagesLoading) : buyerMessagesLoading;
  const setSelected = showTabs ? (activeTab === 'buyer' ? setBuyerSelected : setSellerSelected) : setBuyerSelected;
  const otherLabel = activeTab === 'buyer' || !showTabs ? 'Người bán' : 'Người mua';
  const fetchMessages = (userId: string) => fetchMessagesFor(userId, showTabs ? activeTab : 'buyer');

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

      {showTabs && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('buyer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'buyer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Tin mua hàng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seller')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'seller' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Tin cửa hàng
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: '480px' }}>
        <div className="flex flex-1 min-h-0">
          <div className="w-64 sm:w-72 border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                {showTabs && activeTab === 'seller' ? 'Khách nhắn với bạn' : 'Cuộc trò chuyện'}
              </p>
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
                  <p className="text-sm">
                    {showTabs && activeTab === 'seller' ? 'Chưa có tin nhắn từ khách' : 'Chưa có cuộc trò chuyện'}
                  </p>
                  <p className="text-xs mt-1">
                    {showTabs && activeTab === 'seller' ? 'Tin nhắn sẽ hiện khi có khách liên hệ.' : 'Liên hệ người bán từ trang chi tiết xe.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                <p className="font-semibold text-gray-900">{selected.userName}</p>
                <p className="text-xs text-gray-500">{otherLabel}</p>
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
                        sendMessage(showTabs ? activeTab : 'buyer');
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage(showTabs ? activeTab : 'buyer')}
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
