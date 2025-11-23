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
  hidden?: boolean // Flag to hide messages from UI while keeping them in context
}

interface ChatAgentOverlayProps {
  predictionContext?: any
}

export function ChatAgentOverlay({ predictionContext }: ChatAgentOverlayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialMessages: ChatMessage[] = [];

    // If we have prediction context, include the full analysis as the first message (hidden from UI)
    if (predictionContext?.analysis) {
      initialMessages.push({
        id: 'context',
        role: 'assistant',
        content: predictionContext.analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hidden: true, // Hide from UI but keep in conversation context
      });
    }

    // Add welcome message
    initialMessages.push({
      id: 'welcome',
      role: 'assistant',
      content: predictionContext
        ? "Hi! I'm your BCBA session support assistant. I have access to the behavioral prediction analysis above and can provide practical, session-ready strategies for table work, NET, transitions, and other ABA activities. Ask me about specific antecedents, functions, interventions, or recommendations!"
        : "Hi! I'm your BCBA session support assistant. I can help with practical ABA strategies for clinic sessions, including antecedent interventions, reinforcement schedules, replacement behaviors, and what to document. How can I support your session today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    return initialMessages;
  })

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
    let systemPrompt = 'You are a Board Certified Behavior Analyst (BCBA) providing real-time session support for ABA therapists and RBTs in a clinic setting. Provide practical, concrete, session-ready strategies for table work, NET, transitions, and other ABA activities. Use "do this" language, not vague suggestions.';

    if (predictionContext) {
      const riskLevel = predictionContext.prediction_label || (predictionContext.prediction === 1 ? 'High Risk' : 'Low Risk');
      const confidence = predictionContext.confidence ? Math.round(predictionContext.confidence * 100) : 'N/A';

      systemPrompt += `\n\nYou have access to a behavioral prediction analysis that was provided in the conversation history. The analysis includes:`;
      systemPrompt += `\n- Risk Level: ${riskLevel} (Confidence: ${confidence}%)`;

      if (predictionContext.probabilities) {
        systemPrompt += `\n- Probability of Challenging Behavior: ${Math.round(predictionContext.probabilities.high_risk * 100)}%`;
        systemPrompt += `\n- Probability of Appropriate Behavior: ${Math.round(predictionContext.probabilities.low_risk * 100)}%`;
      }

      if (predictionContext.weather_used) {
        systemPrompt += `\n- Environmental Context: ${predictionContext.weather_used.temperature}°C, ${predictionContext.weather_used.humidity}% humidity, ${predictionContext.weather_used.condition}`;
      }

      systemPrompt += `\n\nThe full behavioral analysis with risk factors, protective factors, actionable recommendations, and monitoring priorities is available in the conversation history. When the user refers to specific numbered items (like "recommendation 4" or "risk factor 2"), refer to the EXACT numbering from the analysis provided earlier in the conversation.`;

      systemPrompt += `\n\nWhen responding:\n`;
      systemPrompt += `- Always reference the specific numbered items from the analysis when the user asks about them\n`;
      systemPrompt += `- Provide concrete, "do this now" strategies that can be implemented in the next 1-2 hours\n`;
      systemPrompt += `- Reference specific MOs/EOs, antecedents, and functions from the data\n`;
      systemPrompt += `- Suggest specific ABA tools: visual schedules, first/then boards, token systems, timers, choice boards\n`;
      systemPrompt += `- Recommend specific reinforcement strategies: dense SR+ schedules (FR1, VR2), DRA, DRO, behavioral momentum\n`;
      systemPrompt += `- Include replacement behaviors: FCT, appropriate mands, coping skills\n`;
      systemPrompt += `- Tell them what precursor behaviors to watch for\n`;
      systemPrompt += `- Suggest what data to collect and communicate to the supervising BCBA\n`;
      systemPrompt += `- Be specific about timing, frequency, and implementation details`;
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
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {!isOpen && (
          <div className="relative group">
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse opacity-75 blur-md group-hover:opacity-100 transition-opacity"></div>

            <Button
              variant="default"
              size="lg"
              className="relative rounded-full shadow-2xl shadow-purple-500/30 px-6 py-3 flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 border-0 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
              onClick={() => setIsOpen(true)}
            >
              {/* Modern chat icon with gradient */}
              <span
                aria-hidden
                className="inline-flex w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <span className="font-semibold text-sm text-white drop-shadow-md">Chat with AI Assistant</span>
            </Button>
          </div>
        )}

        {/* Chat window */}
        {isOpen && (
          <Card
            className={cn(
              'w-[min(100vw-2rem,26rem)] sm:w-[28rem] max-h-[75vh] sm:max-h-[70vh]',
              'flex flex-col shadow-2xl border-2 border-purple-200/50 dark:border-purple-900/50',
              'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900',
              'backdrop-blur-xl rounded-2xl overflow-hidden',
              'animate-in slide-in-from-bottom-5 fade-in duration-300',
              'p-0'
            )}
          >
            <CardHeader className="p-0 flex flex-row items-center justify-between gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-b-2 border-white/20 rounded-t-2xl">
              <div className="flex items-center gap-3 px-4 py-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 17C11.45 17 11 16.55 11 16V12C11 11.45 11.45 11 12 11C12.55 11 13 11.45 13 12V16C13 16.55 12.55 17 12 17ZM13 9H11V7H13V9Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base text-white font-bold drop-shadow-md">AI Support Assistant</CardTitle>
                  <p className="text-xs text-white/90 font-medium">
                    Always here to help • Powered by Claude
                  </p>
                </div>
              </div>
              <div className="flex gap-1 px-3 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-full transition-all hover:scale-110"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 h-full pb-4 pt-3">
              {/* Message list */}
              <div className="flex-1 min-h-[14rem] max-h-[26rem] overflow-y-auto rounded-xl border-2 border-purple-100 dark:border-purple-900/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm p-3 space-y-3 text-sm shadow-inner">
                {messages.filter(msg => !msg.hidden).map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md',
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-purple-100 dark:border-purple-900/50 rounded-bl-md'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <span className={cn(
                        "mt-1.5 text-[0.7rem] opacity-70 block text-right font-medium",
                        msg.role === 'user' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                      )}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {isSending && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in">
                    <div className="bg-white dark:bg-slate-800 border-2 border-purple-100 dark:border-purple-900/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything about behaviors, routines, or the prediction results..."
                    className={cn(
                      'w-full resize-none rounded-xl border-2 border-purple-200 dark:border-purple-900/50',
                      'bg-white dark:bg-slate-900 px-4 py-3 pr-12',
                      'text-sm outline-none transition-all',
                      'focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                      'shadow-sm'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  {/* Character count or status indicator */}
                  {input.length > 0 && (
                    <div className="absolute bottom-2 right-3 text-[0.7rem] text-slate-400 dark:text-slate-500 font-medium">
                      {input.length}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[0.7rem] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Not medical advice
                  </span>
                  <Button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className={cn(
                      "px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                      "text-white shadow-md hover:shadow-lg hover:scale-105",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    {isSending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"></polygon>
                        </svg>
                      </span>
                    )}
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
