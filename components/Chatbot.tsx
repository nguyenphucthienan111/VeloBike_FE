import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, Loader2, Bot } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  listings?: ProductCard[];
}

interface ProductCard {
  id: string;
  title: string;
  price: number;
  image: string;
  url: string;
}

// Parse [PRODUCT:{...}] tokens out of bot message text
const parseMessageParts = (text: string): Array<{ type: 'text'; content: string } | { type: 'product'; data: ProductCard }> => {
  const parts: Array<{ type: 'text'; content: string } | { type: 'product'; data: ProductCard }> = [];
  const regex = /\[PRODUCT:(\{[^}]+\})\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    try { parts.push({ type: 'product', data: JSON.parse(match[1]) }); } catch { /* skip malformed */ }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', content: text.slice(lastIndex) });
  return parts;
};

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const BotMessage: React.FC<{ text: string }> = ({ text }) => {
  const parts = parseMessageParts(text);
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.type === 'text' && part.content.trim()) {
          return <p key={i} className="whitespace-pre-wrap text-sm text-gray-800">{part.content}</p>;
        }
        if (part.type === 'product') {
          const p = part.data;
          return (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-sm transition bg-gray-50 group">
              {p.image && (
                <img src={p.image} alt={p.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-200" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-black">{p.title}</p>
                <p className="text-xs text-green-700 font-bold mt-0.5">{fmt(p.price)}</p>
                <p className="text-[10px] text-blue-600 mt-0.5">Xem trên VeloBike →</p>
              </div>
            </a>
          );
        }
        return null;
      })}
    </div>
  );
};

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);

    if (token && isOpen && messages.length === 0) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    // Vị trí mặc định: gần góc phải dưới, cách phải đủ để không đè ScrollToTop
    const initX = window.innerWidth - 160;
    const initY = window.innerHeight - 96;
    setPosition({ x: initX, y: initY });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/chatbot/history?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform history to messages
        const historyMessages: Message[] = [];
        // The history API returns conversations with messages array
        // We need to flatten this or handle the structure correctly
        // Assuming data.data is array of conversations
        data.data.forEach((conv: any) => {
          conv.messages.forEach((msg: any) => {
            historyMessages.push({
              id: msg._id || Math.random().toString(),
              text: msg.text,
              sender: msg.sender.toLowerCase() === 'user' ? 'user' : 'bot',
              timestamp: msg.timestamp
            });
          });
        });
        
        // Sort by timestamp
        historyMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message immediately
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/chatbot/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: 'bot',
          listings: data.listings?.length > 0 ? data.listings : undefined,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
        setRemaining(data.remaining);
      } else {
        // Handle error (e.g. rate limit)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message || "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Không thể kết nối đến server. Vui lòng kiểm tra mạng.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startDrag = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  const stopDrag = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;

      const padding = 16;
      const maxX = window.innerWidth - padding - 80;
      const maxY = window.innerHeight - padding - 80;

      setPosition({
        x: Math.min(Math.max(padding, newX), maxX),
        y: Math.min(Math.max(padding, newY), maxY),
      });
    };

    const handleMouseUp = () => {
      stopDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-40 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 ${isOpen ? 'hidden' : ''}`}
        aria-label="Mở trợ lý VeloBike"
        style={{ top: position.y, left: position.x }}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
      >
        <Bot size={22} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col ${
          isOpen ? '' : 'hidden'
        }`}
        style={{ height: '500px', top: position.y - 420, left: position.x - 280 }}
      >
        {/* Header */}
        <div
          className="bg-black text-white p-4 rounded-t-2xl flex justify-between items-center cursor-move"
          onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        >
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">VeloBike AI Assistant</h3>
              {remaining !== null && remaining !== -1 && (
                <p className="text-[10px] text-gray-300">Còn lại: {remaining} tin nhắn</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <Bot size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Xin chào! Tôi có thể giúp gì cho bạn về xe đạp?</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button 
                  onClick={() => { setInput("Định giá xe đạp"); }}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100"
                >
                  Định giá xe
                </button>
                <button 
                  onClick={() => { setInput("Quy trình kiểm định"); }}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100"
                >
                  Kiểm định
                </button>
                <button 
                  onClick={() => { setInput("Làm sao để bán xe?"); }}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100"
                >
                  Bán xe
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.sender === 'bot' ? <BotMessage text={msg.text} /> : msg.text}
                  {msg.sender === 'bot' && msg.listings && msg.listings.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500 font-medium">🛒 Sản phẩm có sẵn trên VeloBike:</p>
                      {msg.listings.map(p => (
                        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-sm transition bg-gray-50 group">
                          {p.image && (
                            <img src={p.image} alt={p.title}
                              className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-200" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 line-clamp-2">{p.title}</p>
                            <p className="text-xs text-green-700 font-bold mt-0.5">{fmt(p.price)}</p>
                            <p className="text-[10px] text-blue-600 mt-0.5">Xem chi tiết →</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-black text-white p-2 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
