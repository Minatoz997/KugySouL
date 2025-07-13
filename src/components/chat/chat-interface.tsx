'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Code, 
  Copy, 
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { apiService } from '@/services/api'
import { generateId } from '@/lib/utils'
import type { Message, Conversation } from '@/types'

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const chatResponse = await apiService.sendChatMessage({
        message: userMessage.content,
        model: 'anthropic/claude-3.5-sonnet',
      })

      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: chatResponse.response || 'Sorry, I received an empty response.',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting to the backend. Please ensure the backend server is running and accessible.',
        timestamp: new Date(),
        type: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
  }

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user'
    const isError = message.type === 'error'
    const isCode = message.type === 'code'

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
          {/* Avatar */}
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
              : isError
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-white" />
            ) : isError ? (
              <AlertCircle className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-white" />
            )}
          </div>

          {/* Message content */}
          <Card className={`p-4 ${
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
              : isError
              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              : 'bg-white dark:bg-gray-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isCode ? (
                  <pre className="font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                    <code>{message.content}</code>
                  </pre>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <div className={`text-xs mt-2 ${
                  isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {/* Copy button */}
              {!isUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2"
                  onClick={() => copyToClipboard(message.content, message.id)}
                >
                  {copiedId === message.id ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Chat header */}
      <div className="border-b bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              KugySouL AI Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ready to help with code, web browsing, and more
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4 mx-auto">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to KugySouL
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-md">
                I&apos;m your AI assistant that can execute code, browse the web, manage files, and help with various tasks. 
                What would you like me to help you with today?
              </p>
            </motion.div>
            
            {/* Suggested prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {[
                "Write a Python function to sort a list",
                "Help me scrape data from a website",
                "Create a simple web server",
                "Analyze a CSV file"
              ].map((prompt, index) => (
                <motion.button
                  key={prompt}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setInput(prompt)}
                  className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Code className="h-5 w-5 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {prompt}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Loading indicator */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-start mb-4"
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <Card className="p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          KugySouL is thinking...
                        </span>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white dark:bg-gray-900 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask KugySouL anything... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}