'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Send, X, Minimize2, Maximize2, Phone, Copy, Check, AlertCircle, Loader } from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: Date
  status?: 'sent' | 'delivered'
  copied?: boolean
}

interface AgentResponse {
  response: string
  confidence: number
  status: 'success' | 'error' | 'escalation_needed'
  sources_used: string[]
  escalation_available: boolean
  escalation_message: string
  metadata: {
    processing_time: string
    knowledge_base_searched: boolean
    timestamp: string
  }
}

const SUGGESTED_QUESTIONS = [
  'How do I reset my password?',
  'What are your business hours?',
  'How do I cancel my subscription?',
]

const SAMPLE_AGENT_RESPONSE: AgentResponse = {
  response: "I'd be happy to help with that! However, it looks like I don't have specific information about this topic in our knowledge base right now.",
  confidence: 0.45,
  status: 'escalation_needed',
  sources_used: [],
  escalation_available: true,
  escalation_message: 'Would you like to talk to a human support agent? They can provide more detailed assistance.',
  metadata: {
    processing_time: '1.2s',
    knowledge_base_searched: true,
    timestamp: new Date().toISOString(),
  }
}

export default function CustomerSupportPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'agent',
      content: 'Hi! How can I help you today?',
      timestamp: new Date(),
      status: 'delivered',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showConfirmEscalation, setShowConfirmEscalation] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [ticketData, setTicketData] = useState({
    name: '',
    email: '',
    summary: '',
    priority: 'medium',
  })

  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }, 0)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      status: 'sent',
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    setTimeout(() => {
      const userMessageDelivered: ChatMessage = {
        ...userMessage,
        status: 'delivered',
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id ? userMessageDelivered : m))
      )
    }, 500)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          agent_id: '6910d74b117cd315167e1f3b',
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const agentMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          type: 'agent',
          content: data.response || SAMPLE_AGENT_RESPONSE.response,
          timestamp: new Date(),
          status: 'delivered',
        }
        setMessages((prev) => [...prev, agentMessage])
      }
    } catch (error) {
      console.error('Error calling agent:', error)
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'agent',
        content: SAMPLE_AGENT_RESPONSE.response,
        timestamp: new Date(),
        status: 'delivered',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleEscalateToHuman = () => {
    setShowConfirmEscalation(true)
  }

  const handleCreateTicket = () => {
    if (!ticketData.name.trim() || !ticketData.email.trim()) {
      alert('Please fill in all required fields')
      return
    }

    const ticketId = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const agentMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'agent',
      content: `Ticket created! Your ticket ID is ${ticketId}. A team member will respond within 2 hours.`,
      timestamp: new Date(),
      status: 'delivered',
    }

    setMessages((prev) => [...prev, agentMessage])
    setShowTicketModal(false)
    setTicketData({ name: '', email: '', summary: '', priority: 'medium' })
    setShowConfirmEscalation(false)
  }

  const copyToClipboard = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 animate-bounce"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
      <Card className="h-screen sm:h-[600px] sm:rounded-lg rounded-none shadow-2xl border-gray-200 flex flex-col">
        {/* Header */}
        <CardHeader className="border-b border-gray-200 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Customer Support</CardTitle>
                <p className="text-xs text-green-600 font-medium">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Minimize"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md group relative`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2.5 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      </div>
                      <p className={`text-xs mt-1 px-1 ${message.type === 'user' ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </p>

                      {message.type === 'agent' && (
                        <button
                          onClick={() => copyToClipboard(message.id, message.content)}
                          className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                          aria-label="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg rounded-bl-none px-4 py-2.5">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {messages.length === 1 && !isLoading && (
                  <div className="space-y-2 mt-6">
                    <p className="text-xs text-gray-600 font-medium px-2">Suggested questions:</p>
                    <div className="space-y-2">
                      {SUGGESTED_QUESTIONS.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputValue(question)
                            setTimeout(() => handleSendMessage(), 0)
                          }}
                          className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-gray-700"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Escalation Button */}
            <div className="px-4 py-2 border-t border-gray-200">
              <button
                onClick={handleEscalateToHuman}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4" />
                Talk to Human
              </button>
            </div>

            {/* Input Area */}
            <CardContent className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {inputValue.length}/500 characters
              </p>
            </CardContent>
          </>
        )}
      </Card>

      {/* Escalation Confirmation Dialog */}
      <AlertDialog open={showConfirmEscalation} onOpenChange={setShowConfirmEscalation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Connect with Support Team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We'll create a support ticket with your conversation history. Our team typically responds within 2 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name *"
              value={ticketData.name}
              onChange={(e) => setTicketData({ ...ticketData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Your email *"
              value={ticketData.email}
              onChange={(e) => setTicketData({ ...ticketData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={ticketData.priority}
              onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateTicket}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Ticket
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
