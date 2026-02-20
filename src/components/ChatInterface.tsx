import { useState, useRef, useEffect } from 'react';
import type { VehicleData, Message } from '../types/vehicle';

interface ChatInterfaceProps {
  vehicle: VehicleData;
  onBack: () => void;
}

const getAIResponse = (userMessage: string, vehicle: VehicleData, messageCount: number): string => {
  const lowerMsg = userMessage.toLowerCase();
  
  if (messageCount === 1) {
    return `Entendido. Tenés un ${vehicle.marca} ${vehicle.modelo} ${vehicle.año} con motor ${vehicle.motor}, y el problema es: "${vehicle.falla}".

Voy a ayudarte a diagnosticar esto paso a paso. Primero, contame:

¿La falla es constante o intermitente? ¿Aparece siempre que usás el auto o solo en ciertas condiciones (frío, caliente, en ruta, en ciudad)?`;
  }

  if (lowerMsg.includes('frío') || lowerMsg.includes('frio') || lowerMsg.includes('caliente')) {
    return `Perfecto, eso me da una pista importante.

Siguiente pregunta: ¿Tenés la luz de check engine encendida en el tablero? Si es así, ¿flashea o está fija?

Y si tenés scanner, ¿qué códigos te arroja?`;
  }

  return `Entiendo. Con esa información, sigamos analizando.

¿Podés verificar esto para mí?

1. Presión de nafta: ¿Tenés forma de medirla? Debería estar entre 2.5 y 3.5 bar.

2. Sondas lambda: Si tenés scanner, fijate los valores de sonda 1 - debería oscilar entre 0.1V y 0.9V.

¿Podés chequear eso y me pasás los valores?`;
};

export function ChatInterface({ vehicle, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `¡Hola! Soy MechaIA, tu asistente de diagnóstico automotriz. 🚗🔧

Voy a ayudarte con el ${vehicle.marca} ${vehicle.modelo} patente ${vehicle.patente}. Ya tengo cargados los datos del vehículo.

Contame más sobre la falla: ${vehicle.falla}

¿Hace cuánto apareció este problema? ¿Fue de repente o fue empeorando gradualmente?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(userMessage.content, vehicle, messages.length),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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
              <p className="text-xs text-slate-500 dark:text-slate-400">{vehicle.marca} {vehicle.modelo} · {vehicle.patente}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-4 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs">🤖</span>
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${message.role === 'assistant' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}`}>
              <div className="text-sm leading-relaxed">{message.content}</div>
              <div className={`text-xs mt-2 ${message.role === 'assistant' ? 'text-slate-400' : 'text-blue-200'}`}>{message.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
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
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribí tu respuesta..." className="flex-1 h-12 px-4 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-slate-900 dark:text-white" />
          <button onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl disabled:opacity-50">➤</button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">MechaIA es un asistente de diagnóstico. Siempre verificá las recomendaciones.</p>
      </div>
    </div>
  );
}
