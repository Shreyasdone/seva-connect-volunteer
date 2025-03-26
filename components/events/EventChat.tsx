"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { FiSend, FiMessageCircle } from "react-icons/fi"
import { FaSpinner } from "react-icons/fa"

interface Message {
  id: number
  volunteer_name: string
  volunteer_email: string
  message: string
  created_at: string
}

interface EventChatProps {
  eventId: number
}

export default function EventChat({ eventId }: EventChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [userInfo, setUserInfo] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)

  // Debug info
  const [error, setError] = useState<string | null>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Get user info
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError("User not authenticated")
          return
        }

        // Get user profile info
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()
        
        if (profileError) {
          // Attempt to fetch from volunteer_profiles table as fallback
          const { data: volunteerData, error: volunteerError } = await supabase
            .from("volunteer_profiles")
            .select("*")
            .eq("id", user.id)
            .single()
          
          if (volunteerError) {
            // Use email as fallback
            setUserInfo({
              id: user.id,
              name: user.email?.split('@')[0] || 'Anonymous',
              email: user.email || ''
            })
            return
          }

          setUserInfo({
            id: user.id,
            name: volunteerData.full_name || user.email?.split('@')[0] || 'Anonymous',
            email: volunteerData.email || user.email || ''
          })
          return
        }

        setUserInfo({
          id: user.id,
          name: profileData.full_name || user.email?.split('@')[0] || 'Anonymous',
          email: profileData.email || user.email || ''
        })
      } catch (err) {
        console.error("Error getting user info:", err)
        setError(`Error getting user info: ${err}`)
      }
    }

    getUserInfo()
  }, [])

  // Load chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: true })
        
        if (error) {
          throw error
        }
        
        setMessages(data || [])
      } catch (error: any) {
        console.error("Error fetching chat messages:", error)
        setError(`Error fetching messages: ${error.message}`)
        toast.error("Failed to load chat messages")
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    
    // Subscribe to new messages (realtime)
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `event_id=eq.${eventId}`
      }, (payload) => {
        // @ts-ignore
        setMessages(current => [...current, payload.new])
        setTimeout(scrollToBottom, 100)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom()
    }
  }, [loading, messages.length])

  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      if (!userInfo) {
        throw new Error("User information not loaded")
      }
      
      // Directly insert into chat_messages table instead of using RPC
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          event_id: eventId,
          volunteer_id: user.id,
          volunteer_non_auth_id: null,
          volunteer_name: userInfo.name,
          volunteer_email: userInfo.email,
          message: newMessage
        })
        .select()
      
      if (error) {
        throw error
      }

      console.log("Message sent successfully:", data)
      
      // Immediately add the message to the UI without waiting for realtime update
      if (data && data.length > 0) {
        setMessages(current => [...current, data[0]])
        setTimeout(scrollToBottom, 100)
      }
      
      setNewMessage("")
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError(`Error sending message: ${error.message}`)
      toast.error("Failed to send message")
    } finally {
      setSubmitting(false)
    }
  }

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), "MMM d, h:mm a")
  }

  // Determine if a message is from the current user
  const isCurrentUserMessage = (msg: Message) => {
    return userInfo && msg.volunteer_email === userInfo.email
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Debug info - will only show if there's an error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 mb-3 rounded text-sm">
          <strong>Debug Info:</strong> {error}
        </div>
      )}
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-md p-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <FaSpinner className="animate-spin text-red-600 mr-2" />
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <FiMessageCircle className="text-gray-400 h-12 w-12 mb-2" />
            <p className="text-gray-500">No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = isCurrentUserMessage(msg)
              
              return (
                <div 
                  key={msg.id} 
                  className={`chat-message ${isCurrentUser ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'}`}
                >
                  <div className={`flex items-start ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <div 
                      className={`rounded-full h-8 w-8 flex items-center justify-center mr-2 text-sm font-medium ${
                        isCurrentUser 
                          ? 'bg-red-100 text-red-800 ml-2 mr-0' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {msg.volunteer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className={`flex items-baseline ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        <span className={`font-medium ${isCurrentUser ? 'text-red-900 ml-2' : 'text-red-900 mr-2'}`}>
                          {msg.volunteer_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                      <div 
                        className={`mt-1 p-3 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-red-50 text-right' 
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-gray-700">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(e)
            }
          }}
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || submitting}
          className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 self-end h-[60px] px-4"
        >
          {submitting ? <FaSpinner className="animate-spin" /> : <FiSend />}
        </Button>
      </form>
      
      <p className="text-xs text-gray-500 mt-2">
        Press Enter to send. Use Shift+Enter for a new line.
      </p>
    </div>
  )
} 