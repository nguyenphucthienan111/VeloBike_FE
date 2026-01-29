import React, { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  buyerName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  avatar: string;
}

export const SellerMessages: React.FC = () => {
  const [conversations] = useState<Conversation[]>([
    { id: '1', buyerName: 'Nguyễn Văn A', lastMessage: 'Sản phẩm còn hàng không?', lastTime: '5 phút', unread: 2, avatar: '👨' },
    { id: '2', buyerName: 'Trần Thị B', lastMessage: 'Cảm ơn, hàng đã nhận', lastTime: '2 giờ', unread: 0, avatar: '👩' },
    { id: '3', buyerName: 'Phạm Văn C', lastMessage: 'Có thể giảm giá không?', lastTime: '1 ngày', unread: 1, avatar: '👨' },
    { id: '4', buyerName: 'Lê Thị D', lastMessage: 'Gửi hàng khi nào?', lastTime: '2 ngày', unread: 0, avatar: '👩' },
  ]);

  const [selectedConversationId, setSelectedConversationId] = useState('1');
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'Nguyễn Văn A', content: 'Chào, sản phẩm này chất lượng thế nào?', timestamp: '10:30', isOwn: false },
    { id: '2', sender: 'You', content: 'Chào bạn! Sản phẩm của chúng tôi rất chất lượng, đã được kiểm định kỹ càng.', timestamp: '10:35', isOwn: true },
    { id: '3', sender: 'Nguyễn Văn A', content: 'Sản phẩm còn hàng không?', timestamp: '10:40', isOwn: false },
    { id: '4', sender: 'You', content: 'Dạ, sản phẩm vẫn còn hàng. Bạn có muốn mua không?', timestamp: '10:42', isOwn: true },
  ]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const filteredConversations = conversations.filter(c =>
    c.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: (messages.length + 1).toString(),
      sender: 'You',
      content: messageText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Tin Nhắn</h1>
          <p className="text-gray-600 mt-1">Chat với các khách hàng</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-96 md:h-[600px]">
            {/* Conversations List */}
            <div className="border-r md:border-r bg-gray-50">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              {/* Conversation Items */}
              <div className="overflow-y-auto h-full max-h-96 md:max-h-full">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedConversationId === conv.id ? 'bg-blue-50' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{conv.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-medium text-gray-900 truncate">{conv.buyerName}</p>
                          {conv.unread > 0 && (
                            <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-1">{conv.lastTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="col-span-1 md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-white">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{selectedConversation.avatar}</div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedConversation.buyerName}</p>
                        <p className="text-xs text-gray-500">Trực tuyến</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.isOwn
                              ? 'bg-accent text-white rounded-br-none'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.isOwn ? 'text-red-100' : 'text-gray-500'}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                      >
                        ✉️
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-gray-500">Chọn một cuộc trò chuyện</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
