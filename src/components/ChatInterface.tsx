import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { VehicleData, Message } from '../types/vehicle';

interface ChatInterfaceProps {
  vehicle: VehicleData;
  onBack: () => void;
  diagnosticId?: string;
  initialMessages?: Message[];
}

// Función para convertir timestamps de string a Date
const parseMessages = (messages: Message[] | undefined): Message[] => {
  if (!messages || messages.length === 0) return [];
  return messages.map(m => ({
    ...m,
    timestamp: new Date(m.timestamp),
  }));
};

export function ChatInterface({ vehicle, onBack, diagnosticId, initialMessages }: ChatInterfaceProps) {
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
  const [hasSavedInitial, setHasSavedInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guardar conversación inicial si no hay mensajes previos
  useEffect(() => {
    const saveInitialMessage = async () => {
      if (diagnosticId && !hasSavedInitial && (!initialMessages || initialMessages.length === 0)) {
        console.log('Saving initial message');
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
    console.log('saveConversation - diagnosticId:', diagnosticId);
    console.log('saveConversation - messages count:', updatedMessages.length);

    if (!diagnosticId) {
      console.log('saveConversation - No diagnosticId, skipping save');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('diagnostics')
        .update({ conversacion: updatedMessages })
        .eq('id', diagnosticId)
        .select();

      console.log('saveConversation - response:', data ? 'success' : 'no data', 'error:', error);

      if (error) {
        console.error('Error saving conversation:', error);
      }
    } catch (err) {
      console.error('Exception saving conversation:', err);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

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
      // Llamada a la API de OpenAI
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          vehicle,
        }),
      });

      const data = await response.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Disculpá, no pude procesar tu consulta. Probá de nuevo.',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      
      // Guardar respuesta de la IA
      await saveConversation(finalMessages);
    } catch (error) {
      console.error('Error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Disculpá, estoy teniendo problemas técnicos. Probá de nuevo en unos segundos.',
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorResponse];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } finally {
      setIsTyping(false);
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
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100">←</button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">MechaIA</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle.marca} {vehicle.modelo} · {vehicle.patente}
              </p>
            </div>
          </div>
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
              <div className="text-sm leading-relaxed">{message.content}</div>
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
      </div>
    </div>
  );
}
