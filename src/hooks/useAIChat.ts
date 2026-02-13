import { useState, useCallback } from "react";
import { Event, EventType, Priority } from "@/types/event";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface CreateEventParams {
  title: string;
  type: EventType;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  priority?: Priority;
  location?: string;
  category?: string;
}

interface TimeSuggestion {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface ProductivityInsight {
  type: "tip" | "warning" | "observation";
  message: string;
}

export interface AIAction {
  type: "create_event" | "suggest_times" | "analyze_productivity";
  data: CreateEventParams | { suggestions: TimeSuggestion[] } | { insights: ProductivityInsight[]; busyScore?: number; focusTimeAvailable?: string };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/schedule-assistant`;

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null);

  const sendMessage = useCallback(async (input: string, events: Event[]) => {
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    setPendingAction(null);

    let assistantContent = "";
    let toolCalls: ToolCall[] = [];
    let currentToolCall: Partial<ToolCall> | null = null;

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      // Get the user's JWT access token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated. Please log in to use the AI assistant.");
      }

      const simplifiedEvents = events.map(e => ({
        title: e.title,
        type: e.type,
        date: e.date instanceof Date ? e.date.toISOString() : e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category,
        priority: e.priority,
        description: e.description,
        completed: e.completed,
        location: e.location,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`, // Use user's JWT token
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          events: simplifiedEvents 
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const choice = parsed.choices?.[0];
            
            // Handle regular content
            const content = choice?.delta?.content;
            if (content) updateAssistant(content);
            
            // Handle tool calls
            const deltaToolCalls = choice?.delta?.tool_calls;
            if (deltaToolCalls) {
              for (const tc of deltaToolCalls) {
                if (tc.index !== undefined) {
                  if (tc.id) {
                    // New tool call starting
                    if (currentToolCall && currentToolCall.id) {
                      toolCalls.push(currentToolCall as ToolCall);
                    }
                    currentToolCall = {
                      id: tc.id,
                      type: "function",
                      function: { name: tc.function?.name || "", arguments: tc.function?.arguments || "" }
                    };
                  } else if (currentToolCall) {
                    // Append to existing tool call
                    if (tc.function?.name) {
                      currentToolCall.function = {
                        name: (currentToolCall.function?.name || "") + tc.function.name,
                        arguments: currentToolCall.function?.arguments || ""
                      };
                    }
                    if (tc.function?.arguments) {
                      currentToolCall.function = {
                        name: currentToolCall.function?.name || "",
                        arguments: (currentToolCall.function?.arguments || "") + tc.function.arguments
                      };
                    }
                  }
                }
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {}
        }
      }

      // Push final tool call if exists
      if (currentToolCall && currentToolCall.id) {
        toolCalls.push(currentToolCall as ToolCall);
      }

      // Process tool calls
      if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
          try {
            const args = JSON.parse(tc.function.arguments);
            const actionType = tc.function.name as AIAction["type"];
            
            if (actionType === "create_event") {
              setPendingAction({ type: "create_event", data: args as CreateEventParams });
            } else if (actionType === "suggest_times") {
              setPendingAction({ type: "suggest_times", data: args });
            } else if (actionType === "analyze_productivity") {
              setPendingAction({ type: "analyze_productivity", data: args });
            }
          } catch (e) {
            console.error("Failed to parse tool call:", e);
          }
        }
      }

    } catch (e) {
      console.error("AI chat error:", e);
      setError(e instanceof Error ? e.message : "Failed to get response");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setPendingAction(null);
  }, []);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  return { messages, isLoading, error, pendingAction, sendMessage, clearChat, clearPendingAction };
};
