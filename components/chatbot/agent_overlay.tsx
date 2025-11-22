'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
}

interface ChatAgentOverlayProps {
  predictionContext?: any
}

export function ChatAgentOverlay({ predictionContext }: ChatAgentOverlayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: predictionContext
        ? "Hi! I'm your autism-support AI assistant. I have access to your recent behavioral prediction results. Feel free to ask me questions about the analysis, risk factors, recommendations, or anything else you're curious about!"
        : "Hi! I'm your autism-support AI assistant. You can ask me about behaviors, routines, or anything you're curious about.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    // Build system prompt with prediction context if available
    let systemPrompt = 'You are an autism-support AI assistant. Be gentle, clear, and supportive. You are not a doctor and cannot give medical diagnoses.';

    if (predictionContext) {
      const riskLevel = predictionContext.prediction_label || (predictionContext.prediction === 1 ? 'High Risk' : 'Low Risk');
      const confidence = predictionContext.confidence ? Math.round(predictionContext.confidence * 100) : 'N/A';

      systemPrompt += `\n\nYou have access to the following behavioral prediction analysis for the user. Use this context to provide informed, personalized responses:\n\n`;
      systemPrompt += `PREDICTION SUMMARY:\n`;
      systemPrompt += `- Risk Level: ${riskLevel}\n`;
      systemPrompt += `- Confidence: ${confidence}%\n`;

      if (predictionContext.probabilities) {
        systemPrompt += `- High Risk Probability: ${Math.round(predictionContext.probabilities.high_risk * 100)}%\n`;
        systemPrompt += `- Low Risk Probability: ${Math.round(predictionContext.probabilities.low_risk * 100)}%\n`;
      }

      if (predictionContext.weather_used) {
        systemPrompt += `\nWEATHER CONTEXT:\n`;
        systemPrompt += `- Temperature: ${predictionContext.weather_used.temperature}°C\n`;
        systemPrompt += `- Humidity: ${predictionContext.weather_used.humidity}%\n`;
        systemPrompt += `- Condition: ${predictionContext.weather_used.condition}\n`;
      }

      if (predictionContext.analysis) {
        systemPrompt += `\nFULL BEHAVIORAL ANALYSIS:\n${predictionContext.analysis}\n`;
      }

      systemPrompt += `\nUse this information to answer questions about the prediction, explain risk factors, suggest interventions, or provide support. Be specific and reference the actual data when relevant.`;
    }

        try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // send a simplified history: only role + content
          messages: [
            // optional system prompt to steer behavior
            {
              role: 'system',
              content: systemPrompt,
            },
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: 'user',
              content: userMessage.content,
            },
          ],
        }),
      });

      if (!res.ok) {
        console.error('Chat API error:', await res.text());
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              "Sorry, I'm having trouble connecting to the AI server right now. Please try again in a moment.",
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        setIsSending(false);
        return;
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || "I'm not sure how to respond to that just yet.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling /api/chat:', error);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Something went wrong when contacting the AI. Please check your connection or try again later.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Floating button */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 pointer-events-auto">
        {!isOpen && (
          <Button
            variant="default"
            size="lg"
            className="rounded-full shadow-lg shadow-black/10 px-4 py-2 flex items-center gap-2"
            onClick={() => setIsOpen(true)}
          >
            {/* Simple “chat bubble” icon using pure CSS */}
            <span
              aria-hidden
              className="inline-block w-5 h-5 rounded-full border border-primary bg-primary/10"
            />
            <span className="font-medium text-sm">Chat with AI</span>
          </Button>
        )}

        {/* Chat window */}
        {isOpen && (
          <Card
            className={cn(
              'w-[min(100vw-2rem,22rem)] sm:w-96 max-h-[70vh] sm:max-h-[60vh]',
              'flex flex-col shadow-2xl border border-border/60 bg-background/95 backdrop-blur'
            )}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Autism Support Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Ask about behaviors, routines, or daily challenges.
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2 h-full pb-3">
              {/* Message list */}
              <div className="flex-1 min-h-[10rem] max-h-[22rem] overflow-y-auto rounded-md border border-border/80 bg-muted/50 p-2 space-y-2 text-sm">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex w-full',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-snug',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card text-card-foreground border border-border/70 rounded-bl-sm'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <span className="mt-1 text-[0.65rem] opacity-70 block text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {isSending && (
                  <div className="text-[0.7rem] text-muted-foreground italic mt-1">
                    Assistant is thinking…
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a question about routines, behaviors, or support strategies…"
                  className={cn(
                    'w-full resize-none rounded-md border border-input bg-background px-3 py-2',
                    'text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring'
                  )}
                />
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[0.7rem] text-muted-foreground">
                    This is not medical advice.
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSending || !input.trim()}
                    className="px-3 py-1 text-xs"
                  >
                    {isSending ? 'Sending…' : 'Send'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
