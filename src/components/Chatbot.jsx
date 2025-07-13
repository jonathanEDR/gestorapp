import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToChatbot } from '../services/api';
import { useAuth } from '@clerk/clerk-react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

const Chatbot = () => {
  const [chatData, setChatData] = useState({
    message: '',
    responses: [],
  });
  
  const [isLoading, setIsLoading] = useState(false); // Agregar este estado
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [shouldRead, setShouldRead] = useState(false); // Controla la lectura en voz alta  
  const recognitionRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const { getToken } = useAuth(); // Get both token and auth status
  const chatboxRef = useRef(null); // Para auto-scroll
  const inputRef = useRef(null); // Para focus automático

  // Verificar si se tiene acceso al micrófono
  const checkMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      return false;
    }
  };
  
  // Función para hablar texto (Text-to-Speech)
  const speakText = (text) => {
    if (!SpeechSynthesis || !shouldRead) return;
    
    SpeechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    SpeechSynthesis.speak(utterance);
  };

  const handleInputChange = (e) => {
    setChatData(prev => ({ ...prev, message: e.target.value }));
    setError(null); // Limpiar errores al escribir
  };


  // Function for speech recognition setup
  const setupSpeechRecognition = () => {
    if (!SpeechRecognition) return null;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      setChatData(prev => ({ ...prev, message: transcript }));
    };
    
    recognition.onerror = (event) => {
      console.error('Error de reconocimiento de voz:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (isListening) {
        // Auto-restart if we're still supposed to be listening
        retryTimeoutRef.current = setTimeout(() => {
          if (isListening && recognition) {
            recognition.start();
          }
        }, 1000);
      }
    };
    
    return recognition;
  };

  // Toggle speech recognition
  const toggleListening = async () => {
    const hasMicAccess = await checkMicrophoneAccess();
    
    if (!hasMicAccess) {
      alert('Se requiere permiso para acceder al micrófono.');
      return;
    }
    
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        clearTimeout(retryTimeoutRef.current);
      }
    } else {
      if (!recognitionRef.current) {
        recognitionRef.current = setupSpeechRecognition();
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    }
    
    setIsListening(!isListening);
  };



  const handleSendMessage = async () => {
    if (!chatData.message.trim()) return;
    setIsLoading(true);
    setError(null);
  
    try {
      const token = await getToken();
      const reply = await sendMessageToChatbot({
        message: chatData.message.trim(),
        token: token,
      });
  
      setChatData(prev => ({
        ...prev,
        responses: [...prev.responses, { message: chatData.message.trim(), reply }],
        message: '',
      }));

      // Hacer focus al input después de enviar
      if (inputRef.current) {
        inputRef.current.focus();
      }

      if (shouldRead) {
        speakText(reply);
      }
    } catch (error) {
      console.error('Error al interactuar con el chatbot:', error);
      setError('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [chatData.responses, isLoading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (SpeechSynthesis) {
        SpeechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="chatbot fixed bottom-24 right-4 w-80 h-96 bg-white rounded-lg shadow-xl z-40">
      <div className="p-4 h-full flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Inteligencia artificial de chatbot
        </h2>

        {/* Chatbox con indicador de carga y errores */}
        <div
          className="chatbox flex-1 overflow-y-auto mb-4 p-2 border border-gray-200 rounded-lg"
          ref={chatboxRef}
          aria-live="polite"
        >
          {isLoading && (
            <div className="loading-indicator text-center py-2 animate-pulse">
              <span className="text-gray-500">Procesando mensaje...</span>
            </div>
          )}
          {error && (
            <div className="error-message text-red-500 text-sm mb-2 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          {chatData.responses.length === 0 ? (
            <p className="text-gray-500 text-center">No hay mensajes aún.</p>
          ) : (
            chatData.responses.map((res, index) => (
              <div
                key={index}
                className="message-container mb-2 transition-all duration-300 ease-in-out animate-fadein"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="user-message text-sm text-blue-600">
                  <strong>Usuario:</strong> {res.message}
                </p>
                <p className="bot-message text-sm text-gray-600">
                  <strong>Chatbot:</strong> {res.reply}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input Section */}
        <div className="chatbot-input">
          <div className="input-container flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Escribe tu mensaje..."
              value={chatData.message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              readOnly={isLoading}
              aria-label="Escribe tu mensaje"
              className={`w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${isLoading ? 'bg-gray-100 text-gray-400' : ''}`}
            />
            <button
              onClick={toggleListening}
              disabled={isLoading}
              aria-label={isListening ? 'Detener reconocimiento de voz' : 'Iniciar reconocimiento de voz'}
              className={`microphone-btn p-2 ${isListening ? 'bg-green-500 animate-pulse' : isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-400'} text-white rounded-full flex items-center justify-center`}
            >
              <i className={`fa ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Puedes seguir escribiendo y presiona <span className="font-semibold">Enter</span> para enviar.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="input-actions flex justify-end mt-2 space-x-2">
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !chatData.message.trim()}
            aria-label="Enviar mensaje"
            className={`send-button p-2 ${isLoading || !chatData.message.trim() ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-400'} text-white rounded-full flex items-center justify-center`}
          >
            <i className="fas fa-paper-plane text-xl"></i>
          </button>
          <button
            onClick={() => setShouldRead(prev => !prev)}
            aria-label={shouldRead ? 'Desactivar lectura en voz alta' : 'Activar lectura en voz alta'}
            className="read-toggle-btn p-2 bg-gray-500 text-white rounded-full hover:bg-gray-400 flex items-center justify-center"
          >
            <i className={`fa ${shouldRead ? 'fa-volume-up' : 'fa-volume-off'} text-xl`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};


export default Chatbot;
