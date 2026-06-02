import React, { useState, useRef, useEffect } from 'react';
import { Filters } from './FilterBar';
import { api } from '../api';

interface Msg { role: 'user' | 'assistant'; content: string }

interface Props {
  onSearch: (city: string, neighborhood: string, filters: Partial<Filters>) => void;
  onFiltersChange: (filters: Partial<Filters>) => void;
  loading: boolean;
}

const WELCOME = 'Hi! Tell me what you\'re looking for — for example: "quiet vegan spot in Le Marais, Paris for a date night."';

export default function AgentChat({ onSearch, onFiltersChange, loading }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking || loading) return;
    setInput('');
    const next: Msg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setThinking(true);

    try {
      const res = await fetch(api.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          // msgs is the state BEFORE the current message — avoids sending it twice
          history: msgs.slice(1).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: 'assistant', content: data.reply ?? '...' }]);

      const action = data.action;
      if (!action) return;

      if (action.type === 'search' && action.city) {
        // New location search — neighbourhood defaults to city if not specified
        onSearch(action.city, action.neighborhood || action.city, action.filters ?? {});
      } else if (action.type === 'filter') {
        // Refinement only — merge into existing filters, no re-search
        onFiltersChange(action.filters ?? {});
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={msgList}>
        {msgs.map((m, i) => (
          <div key={i} style={m.role === 'user' ? userBubble : aiBubble}>{m.content}</div>
        ))}
        {thinking && <div style={aiBubble}>Thinking…</div>}
        {loading  && <div style={aiBubble}>Searching…</div>}
        <div ref={bottomRef} />
      </div>
      <div style={inputRow}>
        <input
          style={inp}
          value={input}
          placeholder="Ask me anything…"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={thinking || loading}
        />
        <button style={sendBtn} onClick={send} disabled={thinking || loading}>→</button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' };
const msgList: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 };
const base: React.CSSProperties = { maxWidth: '85%', padding: '8px 12px', borderRadius: 14, fontSize: 13, lineHeight: 1.4 };
const aiBubble: React.CSSProperties = { ...base, background: '#f0f4ff', color: '#222', alignSelf: 'flex-start' };
const userBubble: React.CSSProperties = { ...base, background: '#4285F4', color: '#fff', alignSelf: 'flex-end' };
const inputRow: React.CSSProperties = { display: 'flex', gap: 6, padding: '10px 12px', borderTop: '1px solid #eee' };
const inp: React.CSSProperties = { flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid #ddd', fontSize: 13, outline: 'none' };
const sendBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 20, border: 'none', background: '#4285F4', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 };
