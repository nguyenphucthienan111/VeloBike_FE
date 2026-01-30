import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerSidebar } from '../../components/SellerSidebar';

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

export const SellerMessages: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
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

      const response = await fetch('http://localhost:5000/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const convos = data.data || [];
        setConversations(convos);
        
        // Auto-select first conversation
        if (convos.length > 0) {
          setSelectedConversation(convos[0]);
          fetchMessages(convos[0].userId);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/messages/conversation/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.userId);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          content: messageInput,
        }),
      });

      if (response.ok) {
        // Clear input and refresh messages
        setMessageInput('');
        await fetchMessages(selectedConversation.userId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <SellerSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 flex min-h-0">
          {/* Conversations List */}
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{conversation.userName}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(conversation.lastMessageTime).toLocaleString('vi-VN')}</p>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">Không có cuộc trò chuyện nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-gray-50">
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedConversation.userName}</h3>
                  <p className="text-xs text-gray-500">Buyer</p>
                </div>
                <button 
                  onClick={() => navigate('/seller/profile')}
                  className="flex items-center gap-3 pl-4 border-l border-gray-300 hover:opacity-80 transition-opacity"
                >
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500">SELLER</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center font-bold text-white text-sm">
                    {user?.fullName?.charAt(0) || 'S'}
                  </div>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromSeller ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.isFromSeller
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.isFromSeller ? 'text-gray-300' : 'text-gray-500'}`}>
                          {new Date(message.createdAt).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">Không có tin nhắn nào</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors font-medium"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
