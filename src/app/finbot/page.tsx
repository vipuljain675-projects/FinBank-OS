'use client';

import { useState } from 'react';
import Shell from '@/components/layout/Shell';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, Sparkles, Loader2 } from 'lucide-react';

export default function FinBotPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse(''); 

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setResponse(data.advice);
    } catch (error) {
      setResponse("⚠️ Connection Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Bot size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">FinBot Advisor</h1>
            <p className="text-gray-400">Your personal AI Wealth Manager (Powered by Llama 3)</p>
          </div>
        </div>

        {/* INPUT AREA - FIXED WITH INLINE STYLES */}
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 shadow-xl relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything (e.g., 'Where should I invest $1,200 for growth?')"
            // 👇 FORCING COLORS HERE TO FIX VISIBILITY
            style={{ 
              backgroundColor: '#0f1115', 
              color: 'white', 
              border: '1px solid #374151' 
            }}
            className="w-full h-32 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-gray-500"
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400"/>
              <span>AI Context Aware</span>
            </div>
            <button 
              onClick={sendMessage} 
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-all ${
                loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
              {loading ? 'Thinking...' : 'Ask Advisor'}
            </button>
          </div>
        </div>

        {/* RESPONSE AREA */}
        {response && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px bg-gray-800 flex-grow"></div>
              <span className="text-indigo-400 font-mono text-sm uppercase tracking-widest">FinBot Analysis</span>
              <div className="h-px bg-gray-800 flex-grow"></div>
            </div>

            <div className="bg-[#1a1f2e] border border-indigo-500/30 rounded-2xl p-8 shadow-2xl">
              <div className="prose prose-invert prose-headings:text-indigo-300 prose-strong:text-white prose-table:border-collapse prose-th:bg-gray-800 prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-gray-700 max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({node, ...props}) => <div className="overflow-x-auto my-6 border border-gray-700 rounded-lg"><table className="w-full text-left" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-indigo-900/20 text-indigo-200" {...props} />,
                    th: ({node, ...props}) => <th className="px-4 py-3 font-semibold text-sm uppercase" {...props} />,
                    td: ({node, ...props}) => <td className="px-4 py-3 text-gray-300 border-t border-gray-800/50" {...props} />,
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}