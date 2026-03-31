import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { DiagnosticPDF } from './DiagnosticPDF';
import type { VehicleData, Message } from '../types/vehicle';

interface ChatInterfaceProps {
  vehicle: VehicleData;
  onBack: () => void;
  diagnosticId?: string;
  initialMessages?: Message[];
  isCompleted?: boolean;
  onComplete?: () => void;
  userEmail?: string;
}

// Función para convertir timestamps de string a Date
const parseMessages = (messages: Message[] | undefined): Message[] => {
  if (!messages || messages.length === 0) return [];
  return messages.map(m => ({
    ...m,
    timestamp: new Date(m.timestamp),
  }));
};

export function ChatInterface({ vehicle, onBack, diagnosticId, initialMessages, isCompleted = false, onComplete, userEmail }: ChatInterfaceProps) {
  const defaultMessage: Message = {
    id: '1',
    role: 'assistant',
    content: `¡Hola! Soy MechaIA, tu asistente de diagnóstico automotriz. 🚗🔧

Voy a ayudarte con el ${vehicle.marca} ${vehicle.modelo} patente ${vehicle.patente}.

Contame más sobre la falla: "${vehicle.falla}"

¿Hace cuánto apareció este problema? ¿Fue de repente o fue empeorando gradualmente?`,
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0
      ? parseMessages(initialMessages)
      : [defaultMessage]
  );
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [hasSavedInitial, setHasSavedInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guardar conversación inicial si no hay mensajes previos
  useEffect(() => {
    const saveInitialMessage = async () => {
      if (diagnosticId && !hasSavedInitial && (!initialMessages || initialMessages.length === 0)) {
        await supabase
          .from('diagnostics')
          .update({ conversacion: [defaultMessage] })
          .eq('id', diagnosticId);
        setHasSavedInitial(true);
      }
    };
    saveInitialMessage();
  }, [diagnosticId, initialMessages, hasSavedInitial]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Guardar conversación en Supabase
  const saveConversation = async (updatedMessages: Message[]) => {
    if (!diagnosticId) return;

    try {
      const { error } = await supabase
        .from('diagnostics')
        .update({ conversacion: updatedMessages })
        .eq('id', diagnosticId);

      if (error) {
        console.error('Error saving conversation:', error);
      }
    } catch (err) {
      console.error('Exception saving conversation:', err);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isCompleted) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    // Guardar mensaje del usuario
    await saveConversation(updatedMessages);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          vehicle,
        }),
      });

      // Errores HTTP (auth, suscripción, rate limit) — siempre JSON
      if (!response.ok) {
        let data: { error?: string; message?: string } = {};
        try { data = await response.json(); } catch { /* no-op */ }
        if (data.error === 'trial_exhausted' || data.error === 'subscription_required' || data.error === 'limit_reached') {
          throw new Error(data.message || data.error);
        }
        throw new Error(data.error || `Error ${response.status}`);
      }

      // Respuesta exitosa — streaming SSE
      const newId = (Date.now() + 1).toString();
      setStreamingId(newId);
      setIsTyping(false);
      setMessages([...updatedMessages, { id: newId, role: 'assistant', content: '', timestamp: new Date() }]);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              fullContent += parsed.text;
              setMessages(prev => prev.map(m => m.id === newId ? { ...m, content: fullContent } : m));
            }
            if (parsed.error) {
              fullContent = parsed.error;
              setMessages(prev => prev.map(m => m.id === newId ? { ...m, content: fullContent } : m));
            }
          } catch { /* chunk incompleto, continuar */ }
        }
      }

      // Guardar solo si hay contenido real
      if (fullContent && !fullContent.startsWith('Error')) {
        const finalMessages = updatedMessages.concat({ id: newId, role: 'assistant', content: fullContent, timestamp: new Date() });
        await saveConversation(finalMessages);
      }
    } catch (error) {
      console.error('Error en chat:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setMessages([...updatedMessages, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      setStreamingId(null);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const qrDataUrl = await QRCode.toDataURL('https://mechaia.app', { width: 96, margin: 1 });
      const workshopName = userEmail ? userEmail.split('@')[0] : 'Taller Mecánico';
      const blob = await pdf(
        <DiagnosticPDF vehicle={vehicle} messages={messages} workshopName={workshopName} qrDataUrl={qrDataUrl} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnostico-${vehicle.patente}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">←</button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/logo.png" alt="MechaIA" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">MechaIA</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle.marca} {vehicle.modelo} · {vehicle.patente}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || messages.length <= 1}
            className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isGeneratingPDF ? '⏳ Generando...' : '⬇ PDF'}
          </button>
          {isCompleted ? (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              ✓ Completado
            </span>
          ) : (
            onComplete && (
              <button
                onClick={onComplete}
                className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Marcar completado
              </button>
            )
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs">🤖</span>
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                message.role === 'assistant'
                  ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              }`}
            >
              <div className="text-sm leading-relaxed">
                {message.role === 'assistant' ? (
                  <>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    {streamingId === message.id && (
                      <span className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </>
                ) : (
                  message.content
                )}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.role === 'assistant' ? 'text-slate-400' : 'text-blue-200'
                }`}
              >
                {message.timestamp instanceof Date
                  ? message.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-slate-600 dark:text-slate-300 text-xs">👤</span>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-xs">🤖</span>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        {isCompleted ? (
          <div className="text-center py-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Este diagnóstico fue marcado como completado.</p>
            <button onClick={onBack} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ← Volver al inicio
            </button>
          </div>
        ) : (
          <>
            <div className="max-w-3xl mx-auto flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu respuesta..."
                className="flex-1 h-12 px-4 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-slate-900 dark:text-white"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl disabled:opacity-50"
              >
                ➤
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              MechaIA es un asistente de diagnóstico. Siempre verificá las recomendaciones.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
