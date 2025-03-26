"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { FiMessageCircle, FiChevronRight } from "react-icons/fi"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { toast } from "sonner"

interface RecentMessage {
  id: number
  message: string
  volunteer_name: string
  created_at: string
  event_id: number
  event_title: string
}

export default function RecentDiscussions() {
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRecentDiscussions = async () => {
      setLoading(true)
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error("User not authenticated")
        }
        
        // Get events where the user is registered
        const { data: userEvents, error: eventsError } = await supabase
          .from("volunteer_event")
          .select("event_id")
          .eq("volunteer_id", user.id)
          .eq("status", "registered")
        
        if (eventsError) {
          throw eventsError
        }
        
        if (!userEvents || userEvents.length === 0) {
          setLoading(false)
          return // No events to fetch messages from
        }
        
        const eventIds = userEvents.map(item => item.event_id)
        
        // Fetch recent messages from these events with event titles
        const { data: messagesWithEvents, error: messagesError } = await supabase
          .from("chat_messages")
          .select(`
            id,
            message,
            volunteer_name,
            created_at,
            event_id,
            events:event_id (
              title
            )
          `)
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })
          .limit(5)
        
        if (messagesError) {
          throw messagesError
        }
        
        if (messagesWithEvents) {
          // Format the data to include event title
          const formattedMessages = messagesWithEvents.map(msg => ({
            id: msg.id,
            message: msg.message,
            volunteer_name: msg.volunteer_name,
            created_at: msg.created_at,
            event_id: msg.event_id,
            event_title: msg.events.title
          }))
          
          setRecentMessages(formattedMessages)
        }
      } catch (error) {
        console.error("Error fetching recent discussions:", error)
        toast.error("Failed to load recent discussions")
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecentDiscussions()
  }, [])
  
  // Format timestamp for display
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return format(date, "h:mm a")
    }
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    if (isYesterday) {
      return "Yesterday, " + format(date, "h:mm a")
    }
    
    return format(date, "MMM d, h:mm a")
  }
  
  // Truncate message if too long
  const truncateMessage = (message: string, maxLength: number = 120) => {
    if (message.length <= maxLength) return message
    return message.slice(0, maxLength) + "..."
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-red-900 flex items-center">
          <FiMessageCircle className="mr-2" />
          Recent Discussions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>No recent discussions found.</p>
            <p className="text-sm mt-1">
              Join an event and start chatting with other volunteers!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <Link
                href={`/dashboard/events/${message.event_id}`}
                key={message.id}
                className="block"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="bg-red-100 text-red-800 rounded-full h-10 w-10 flex items-center justify-center font-medium">
                    {message.volunteer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {message.volunteer_name}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 truncate">
                      {truncateMessage(message.message)}
                    </p>
                    <div className="flex items-center text-xs text-red-700">
                      <span className="truncate">Event: {message.event_title}</span>
                      <FiChevronRight className="ml-1 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 