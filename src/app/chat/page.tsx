"use client";

import { useState, useEffect, useRef } from "react";
import { ProtectedRoute, useVerification } from "@/components/ProtectedRoute";

/**
 * Protected Chat Page
 *
 * This page is only accessible to users who have successfully verified
 * their zero-knowledge proof. Access is granted based on verification session.
 */

// API Configuration
const API_BASE_URL = "http://localhost:8080";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

type ModelType = "t_tuned" | "c-tuned" | "default";

function ChatContent() {
  const { session } = useVerification();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>("t_tuned");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Get user ID from session (nullifier hash for privacy)
  const userId = session?.nullifier || "";

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!userId) return;

      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/get_chat_by_user/${userId}/${selectedModel}`
        );

        if (response.ok) {
          const history = await response.json();
          const formattedMessages: Message[] = history.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [userId, selectedModel]);

  // Send message to API
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !userId) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    // Optimistically add user message to UI
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          question: userMessage,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const conversation = await response.json();

      // Update messages with the full conversation from API
      const formattedMessages: Message[] = conversation.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString(),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg !== newUserMessage));
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Chat Header - Minimal */}
        <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold">Medical AI Chat</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelType)}
            className="px-3 py-1 text-sm bg-white/20 border border-white/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            disabled={isLoading}
          >
            <option value="t_tuned">Token Tuned</option>
            <option value="c-tuned">Conv Tuned</option>
            <option value="default">Default</option>
          </select>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 text-sm mt-2">Loading...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Start a conversation...</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
                      message.role === "user" ? "bg-green-500" : "bg-blue-500"
                    }`}
                  >
                    {message.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    <div
                      className={`rounded-lg p-4 shadow-sm ${
                        message.role === "user" ? "bg-green-100" : "bg-white"
                      }`}
                    >
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              disabled={isLoading || !userId}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || !userId}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
