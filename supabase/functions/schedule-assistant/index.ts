import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message cannot be empty").max(10000, "Message too long"),
});

const EventSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(["task", "meeting", "note"]),
  date: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  category: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  description: z.string().max(5000).optional(),
  completed: z.boolean().optional(),
  location: z.string().max(500).optional(),
}).passthrough();

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, "At least one message required").max(100, "Too many messages"),
  events: z.array(EventSchema).max(500, "Too many events").optional().default([]),
});

const tools = [
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Create a new event (task, meeting, or note) on the user's calendar based on their natural language request.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The event title" },
          type: { type: "string", enum: ["task", "meeting", "note"], description: "Type of event" },
          date: { type: "string", description: "ISO date string (YYYY-MM-DD)" },
          startTime: { type: "string", description: "Start time in HH:MM format (24h)" },
          endTime: { type: "string", description: "End time in HH:MM format (24h)" },
          description: { type: "string", description: "Event description" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority for tasks" },
          location: { type: "string", description: "Location for meetings" },
          category: { type: "string", description: "Category name" },
        },
        required: ["title", "type", "date"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_times",
      description: "Analyze the user's schedule and suggest optimal time slots for a new event.",
      parameters: {
        type: "object",
        properties: {
          duration: { type: "number", description: "Duration in minutes" },
          preferredTimeOfDay: { type: "string", enum: ["morning", "afternoon", "evening", "any"], description: "Preferred time of day" },
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "ISO date string" },
                startTime: { type: "string", description: "Start time HH:MM" },
                endTime: { type: "string", description: "End time HH:MM" },
                reason: { type: "string", description: "Why this slot is good" },
              },
              required: ["date", "startTime", "endTime", "reason"],
            },
          },
        },
        required: ["suggestions"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_productivity",
      description: "Provide productivity insights based on the user's schedule patterns.",
      parameters: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["tip", "warning", "observation"] },
                message: { type: "string" },
              },
              required: ["type", "message"],
            },
          },
          busyScore: { type: "number", description: "How busy is the user (0-100)" },
          focusTimeAvailable: { type: "string", description: "Hours of focus time available this week" },
        },
        required: ["insights"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Parse and validate request body
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validationResult = RequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return new Response(JSON.stringify({ error: `Validation failed: ${errorMessage}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, events } = validationResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Group events by time period for better context
    const upcomingEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= today;
    }).slice(0, 20);

    const todayEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate.toISOString().split('T')[0] === todayStr;
    });

    const thisWeekEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return eventDate >= today && eventDate <= weekFromNow;
    });

    // Calculate schedule density
    const taskCount = events.filter((e) => e.type === 'task').length;
    const meetingCount = events.filter((e) => e.type === 'meeting').length;
    const completedTasks = events.filter((e) => e.type === 'task' && e.completed).length;

    const eventsContext = `
## Current Schedule Context

**Today:** ${dayOfWeek}, ${todayStr}

### Today's Events (${todayEvents.length}):
${todayEvents.length > 0 ? JSON.stringify(todayEvents, null, 2) : "No events scheduled for today."}

### This Week (${thisWeekEvents.length} events):
${thisWeekEvents.length > 0 ? JSON.stringify(thisWeekEvents, null, 2) : "No upcoming events this week."}

### Schedule Statistics:
- Total tasks: ${taskCount} (${completedTasks} completed)
- Total meetings: ${meetingCount}
- Upcoming events: ${upcomingEvents.length}

### All Upcoming Events:
${upcomingEvents.length > 0 ? JSON.stringify(upcomingEvents, null, 2) : "No upcoming events."}
`;

    const systemPrompt = `You are Spark, an intelligent AI assistant for Synapflow - a productivity and calendar app. You have access to the user's complete schedule and powerful tools to help them manage their time effectively.

## Your Capabilities

1. **Natural Language Event Creation**: When users ask to schedule something, use the create_event tool to add it to their calendar. Parse dates naturally (e.g., "tomorrow", "next Monday", "in 2 hours").

2. **Smart Time Suggestions**: When users need to find time for something, analyze their schedule and use suggest_times to recommend optimal slots based on:
   - Existing commitments and gaps
   - Time of day preferences
   - Buffer time between meetings
   - Focus time protection

3. **Productivity Analysis**: Use analyze_productivity to provide insights about:
   - Schedule balance and potential overload
   - Patterns in their time usage
   - Recommendations for better time management

## Guidelines

- Be conversational, friendly, and proactive
- When creating events, confirm the details with the user
- Consider context: morning = 9AM-12PM, afternoon = 12PM-5PM, evening = 5PM-9PM
- For tasks without specific times, suggest reasonable defaults
- Use emojis sparingly to keep things engaging 😊
- If the user's request is ambiguous, ask clarifying questions
- Always provide actionable advice, not just observations

## Date/Time Handling
- Current date: ${todayStr} (${dayOfWeek})
- Parse relative dates: "tomorrow" = day after today, "next week" = 7 days from now
- Default meeting duration: 30 minutes
- Default task priority: medium

${eventsContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
