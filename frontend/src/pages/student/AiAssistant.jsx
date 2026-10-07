import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/api';
import { FiCpu, FiSend, FiUser, FiInfo, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function cleanMarkdownText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\u2011/g, '-') // Replace non-breaking hyphen with standard hyphen
    .replace(/\uFFFD/g, '')  // Remove unicode replacement char
    .replace(/\r\n/g, '\n'); // Normalize line endings
}

export default function StudentAiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello Explorer! 👋 I'm your Socratic STEM Study Partner. I won't just give you quick answers—I'll help you think through science, math, and coding concepts step-by-step so you really understand them. What are you studying today?",
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    'Why does an iron nail sink but a heavy ship float?',
    'How do I balance simple linear equations?',
    'What makes an electromagnet turn on and off?',
    'Can you explain the difference between acids and bases?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chatTutor({
        query,
        grade: user?.grade || '7',
      });

      const aiReply =
        res.data?.data?.response ||
        res.data?.response ||
        res.data?.hint ||
        'I received your query, but could not formulate a response.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Failed to get AI assistant response:', err);
      const errMsg =
        err.response?.data?.message ||
        'Unable to connect to the STEM AI Tutor service right now. Please verify the AI server or try again later.';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: errMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: "Chat cleared! 🌟 Feel free to ask any STEM, science, or math question whenever you're ready.",
        time: 'Just now',
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <FiCpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Socratic STEM AI Tutor</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Live AI Active
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Guidance-focused • Child-Safe • Bloom Scaffolding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <FiInfo className="w-3.5 h-3.5 text-blue-500" />
            <span>Middle-school conceptual tutoring</span>
          </div>
          {messages.length > 2 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Clear conversation"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          const isError = Boolean(m.isError);
          const sanitizedText = cleanMarkdownText(m.text);

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : isError
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-slate-900 text-cyan-400'
                }`}
              >
                {isUser ? <FiUser className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl sm:max-w-2xl lg:max-w-3xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                }`}
              >
                {isUser || isError ? (
                  <div className="whitespace-pre-line">{sanitizedText}</div>
                ) : (
                  <div className="text-slate-800 leading-relaxed space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-base sm:text-lg font-black text-slate-900 mt-3 mb-1.5" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-sm sm:text-base font-black text-slate-900 mt-2.5 mb-1" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-2 mb-0.5" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed text-slate-800" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 space-y-1 mb-2.5 marker:text-purple-600" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-5 space-y-1 mb-2.5 marker:text-purple-600 font-medium" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-extrabold text-slate-900" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="italic text-slate-700" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-4 border-purple-500 bg-purple-50/70 pl-3.5 py-2 my-2.5 rounded-r-xl text-slate-700 text-xs sm:text-sm italic"
                            {...props}
                          />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr className="my-3.5 border-slate-200" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
                            <table className="w-full text-xs text-left border-collapse" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="px-3 py-2 border-r last:border-r-0 border-slate-200 font-bold" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="px-3 py-2 border-t border-r last:border-r-0 border-slate-100 bg-white" {...props} />
                        ),
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code
                              className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold"
                              {...props}
                            />
                          ) : (
                            <code
                              className="block bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2"
                              {...props}
                            />
                          ),
                      }}
                    >
                      {sanitizedText}
                    </ReactMarkdown>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 text-right ${
                    isUser ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center text-xs">
              <FiCpu className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              <span>Formulating Socratic guidance...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sample Quick Prompts */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">Try asking:</span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(p)}
            className="text-[11px] whitespace-nowrap bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 px-3 py-1 rounded-full transition-all cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask a science, technology, or math question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="stem-input text-xs sm:text-sm py-3"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="stem-btn stem-btn-primary py-3 px-5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <span>Ask</span>
            <FiSend className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
