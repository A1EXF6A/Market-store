import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { useAuthStore } from "@/store/authStore";
import type { Chat, Message } from "@/types";
import { chatService } from "@services/chat";
import { socketService } from "@services/websocket";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Plus,
  Search,
  Send,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, getToken } = useAuthStore();
  const [otherUser, setOtherUser] = useState(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (id && chats.length > 0) {
      const chat = chats.find((c) => c.chatId === Number(id));
      if (chat) {
        selectChat(chat);
      }
    }
  }, [id, chats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Connect to socket
      const token = getToken();
      if (token) {
        socketService.connect(token);
      }

      // Load chats
      const chatData = await chatService.getChats();
      setChats(chatData);

      // Set up socket listeners
      socketService.onNewMessage((message: Message) => {
        //codificamos el mensaje que llega por websocket
        message = JSON.parse(message.content);

        console.log("New message received via socket:", message);
        setMessages((prev) => [...prev, message]);

        // Update chat list to move this chat to top
        setChats((prev) => {
          const chatIndex = prev.findIndex((c) => c.chatId === message.chatId);
          if (chatIndex > -1) {
            const updatedChats = [...prev];
            const [chat] = updatedChats.splice(chatIndex, 1);
            return [chat, ...updatedChats];
          }
          return prev;
        });
      });

      socketService.onUserTyping(({ userId, isTyping }) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      });
    } catch (error: any) {
      toast.error("Error al cargar chats");
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chat: Chat) => {
    if (selectedChat?.chatId === chat.chatId) return;

    try {
      // Leave previous chat
      if (selectedChat) {
        socketService.leaveChat(selectedChat.chatId);
      }

      setSelectedChat(chat);
      setMessages([]);

      // Join new chat
      socketService.joinChat(chat.chatId);

      // Load messages

      const messagesData = await chatService.getChatMessages(chat.chatId);
      setMessages(messagesData);
      //set other user
      const otherUser =
        user?.userId === chat.buyerId ? chat.seller : chat.buyer;
      setOtherUser(otherUser);
      // Update URL
      navigate(`/chat/${chat.chatId}`, { replace: true });
    } catch (error: any) {
      toast.error("Error al cargar mensajes");
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;
    try {
      setSending(true);
      const messageData = {
        chatId: selectedChat.chatId,
        content: newMessage.trim(),
        senderId: user?.userId,
      };

      // Send via socket for real-time
      socketService.sendMessage(
        selectedChat.chatId,
        JSON.stringify(messageData),
      );

      // Also send via API for persistence
      await chatService.sendMessage(messageData);

      setNewMessage("");

      // Stop typing indicator
      socketService.setTyping(selectedChat.chatId, false);
    } catch (error: any) {
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (selectedChat) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator
      socketService.setTyping(selectedChat.chatId, true);

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.setTyping(selectedChat.chatId, false);
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherUser = (chat: Chat) => {
    if (!user) return null;
    return user.userId === chat.buyerId ? chat.seller : chat.buyer;
  };

  const filteredChats = chats.filter((chat) => {
    const otherUser = getOtherUser(chat);
    if (!otherUser) return false;
    const fullName =
      `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Chat List Sidebar */}
      <div className="w-1/3 border-r bg-gray-50">
        <Card className="h-full rounded-none border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversaciones
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conversaciones..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay conversaciones
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Inicia una conversación contactando a un vendedor
                </p>
                <Button size="sm" asChild>
                  <Link to="/products">
                    <Plus className="h-4 w-4 mr-1" />
                    Explorar productos
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChats.map((chat) => {
                  const otherUser = getOtherUser(chat);
                  if (!otherUser) return null;

                  const isSelected = selectedChat?.chatId === chat.chatId;
                  const lastMessage = chat.messages?.[chat.messages.length - 1];

                  return (
                    <div
                      key={chat.chatId}
                      onClick={() => selectChat(chat)}
                      className={`p-4 cursor-pointer border-b hover:bg-gray-100 transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {otherUser.firstName[0]}
                            {otherUser.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 truncate">
                              {otherUser.firstName} {otherUser.lastName}
                            </p>
                            {lastMessage && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(lastMessage.sentAt), "HH:mm", {
                                  locale: es,
                                })}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {lastMessage.senderId === user?.userId
                                ? "Tú: "
                                : ""}
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="border-b bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/chat")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {(() => {
                    const otherUser = getOtherUser(selectedChat);
                    return otherUser ? (
                      <>
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {otherUser.firstName[0]}
                            {otherUser.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {otherUser.firstName} {otherUser.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {user?.userId === selectedChat.buyerId
                              ? "Vendedor"
                              : "Comprador"}
                          </p>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === user?.userId;
                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div
                        className={`flex items-center justify-end mt-1 ${
                          isOwn ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="text-xs">
                          {format(
                            new Date(
                              message.sentAt ?? new Date().toISOString(),
                            ),
                            "HH:mm",
                            { locale: es },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {Array.from(typingUsers).filter(
                (userId) => userId !== otherUser?.userId,
              ).length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-xs ml-2">Escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t bg-white p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-gray-600">
                Elige una conversación de la lista para empezar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

