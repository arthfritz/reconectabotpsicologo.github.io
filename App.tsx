import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { Message, Sender } from './types';
import { createChatSession } from './services/geminiService';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
</style>
const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-message',
      text: "Olá! Eu sou seu psicólogo, seu/sua companheiro(a) na ReConecta. Estou aqui para ouvir e oferecer um espaço de apoio para você. Como você está se sentindo hoje?",
      sender: Sender.BOT,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on component mount
    if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to the latest message
    chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
    });
  }, [messages]);

  const handleSendMessage = async (userMessageText: string) => {
    if (!chatSessionRef.current) return;
    
    setIsLoading(true);
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: Sender.USER,
    };
    
    const botMessageId = `bot-${Date.now()}`;
    const botMessagePlaceholder: Message = {
        id: botMessageId,
        text: '',
        sender: Sender.BOT
    };

    setMessages(prev => [...prev, userMessage, botMessagePlaceholder]);
    
    try {
      const stream = await chatSessionRef.current.sendMessageStream({ message: userMessageText });
      
      let botResponseText = '';
      for await (const chunk of stream) {
        botResponseText += chunk.text;
        setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const botMessageIndex = newMessages.findIndex(msg => msg.id === botMessageId);
            if (botMessageIndex !== -1) {
                newMessages[botMessageIndex] = { ...newMessages[botMessageIndex], text: botResponseText };
            }
            return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Desculpe, encontrei um erro. Por favor, tente novamente.",
        sender: Sender.BOT,
      };
      // Replace the placeholder with the error message
      setMessages(prev => {
          const newMessages = [...prev];
          const botMessageIndex = newMessages.findIndex(msg => msg.id === botMessageId);
          if (botMessageIndex !== -1) {
              newMessages[botMessageIndex] = errorMessage;
              return newMessages;
          }
          // fallback if placeholder isn't found
          return [...prev.slice(0, -1), errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-neutral-100 font-sans">
      <Header />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 container mx-auto">
        <div className="flex flex-col">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </div>
      </main>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;