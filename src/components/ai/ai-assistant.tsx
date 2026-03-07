'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  Sparkles, 
  Send, 
  Loader2, 
  MessageSquare, 
  User, 
  Bot,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  relevantPlayers?: string[]
  suggestions?: string[]
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  queryType?: string
  timestamp: Date
}

const EXAMPLE_QUERIES = [
  "Who should open against a strong pace attack?",
  "Which players haven't played recently?",
  "Who are our best batsmen?",
  "Who is the captain?",
  "List all wicketkeepers",
  "Who are our all-rounders?",
  "Players in good form",
  "Who needs more game time?"
]

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showExamples, setShowExamples] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setShowExamples(false)

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation AskTeamAssistant($input: NLQueryInput!) {
              askTeamAssistant(input: $input) {
                answer
                relevantPlayers
                suggestions
                confidence
                queryType
              }
            }
          `,
          variables: { input: { query } }
        })
      })

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to get response')
      }

      const result = data.data.askTeamAssistant

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        relevantPlayers: result.relevantPlayers,
        suggestions: result.suggestions,
        confidence: result.confidence,
        queryType: result.queryType,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't process that. ${error instanceof Error ? error.message : 'Please try again.'}`,
        confidence: 'LOW',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    handleSubmit(example)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion)
  }

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'HIGH':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">High Confidence</span>
      case 'MEDIUM':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Medium Confidence</span>
      case 'LOW':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Low Confidence</span>
      default:
        return null
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-300 border-purple-200",
      isExpanded ? "fixed inset-4 z-50 flex flex-col" : ""
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">AI Team Assistant</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Ask questions about your team in natural language
        </CardDescription>
      </CardHeader>

      <CardContent className={cn(
        "flex flex-col",
        isExpanded ? "flex-1 overflow-hidden" : ""
      )}>
        {/* Messages Area */}
        <div className={cn(
          "space-y-4 overflow-y-auto",
          isExpanded ? "flex-1 mb-4" : "max-h-[300px] mb-4"
        )}>
          {messages.length === 0 && showExamples && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <span>Try asking:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.slice(0, 6).map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    className="text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.role === 'user' 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-900"
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.role === 'assistant' && message.relevantPlayers && message.relevantPlayers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Relevant players:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.relevantPlayers.map((player, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {player}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Follow-up questions:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.role === 'assistant' && (
                  <div className="mt-2 flex items-center justify-between">
                    {getConfidenceBadge(message.confidence)}
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-purple-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(inputValue)
              }
            }}
            placeholder="Ask about your team..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSubmit(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
