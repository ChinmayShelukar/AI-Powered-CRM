import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { Sparkles, Send, Database, AlertCircle, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { aiApi } from "@/services/ai";
import type { AiQueryResponse } from "@/types/api";

interface UserMessage {
  id: string;
  role: "user";
  question: string;
  ts: Date;
}

interface AiMessage {
  id: string;
  role: "assistant";
  question: string;
  chatResponse: string | null;  // plain text reply (greeting / help / out-of-scope)
  sql: string | null;           // null when chatResponse is set
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  ts: Date;
}

interface ErrorMessage {
  id: string;
  role: "error";
  question: string;
  text: string;
  ts: Date;
}

type Message = UserMessage | AiMessage | ErrorMessage;

const SUGGESTED = [
  "How many deals are currently in negotiation?",
  "Show me all contacts assigned to me",
  "Which deals close this month?",
  "List activities logged in the last 7 days",
  "What's the total pipeline value by stage?",
];

function SqlBlock({ sql }: { sql: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-muted/60">
      <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-1.5">
        <Database className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Generated SQL
        </span>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-foreground">
        <code>{sql}</code>
      </pre>
    </div>
  );
}

const MAX_CELL = 48;

function cell(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function ResultTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (rows.length === 0) return null;
  const cols = Object.keys(rows[0]);

  return (
    <div className="overflow-hidden rounded-md border border-border/60">
      <table className="w-full table-fixed text-xs">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40">
            {cols.map((c) => (
              <th
                key={c}
                title={c}
                className="truncate px-3 py-2 text-left font-medium text-muted-foreground"
                style={{ maxWidth: 180 }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30"
            >
              {cols.map((c) => {
                const raw = cell(row[c]);
                const truncated = raw.length > MAX_CELL ? raw.slice(0, MAX_CELL) + "…" : raw;
                return (
                  <td
                    key={c}
                    title={raw || undefined}
                    className="truncate px-3 py-2 tabular-nums text-foreground"
                    style={{ maxWidth: 180 }}
                  >
                    {raw === "" ? (
                      <span className="text-muted-foreground/60">—</span>
                    ) : (
                      truncated
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AiResponseBubble({ msg }: { msg: AiMessage }) {
  const botAvatar = (
    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-white shadow-sm shadow-primary/30">
      <Bot className="h-4 w-4" />
    </div>
  );

  if (msg.chatResponse) {
    return (
      <div className="flex gap-3">
        {botAvatar}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="rounded-xl rounded-tl-sm border border-border/70 bg-card px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed text-foreground">{msg.chatResponse}</p>
          </div>
          <p className="px-1 text-[11px] tabular-nums text-muted-foreground">{formatTime(msg.ts)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {botAvatar}
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="rounded-xl rounded-tl-sm border border-border/70 bg-card px-4 py-3 shadow-sm">
          {msg.sql && <SqlBlock sql={msg.sql} />}
          {msg.rows.length > 0 ? (
            <div className="mt-2.5 space-y-1.5">
              <ResultTable rows={msg.rows} />
              <p className="text-right text-[11px] text-muted-foreground tabular-nums">
                {msg.rowCount} {msg.rowCount === 1 ? "row" : "rows"} returned
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Query returned no rows.</p>
          )}
        </div>
        <p className="px-1 text-[11px] tabular-nums text-muted-foreground">{formatTime(msg.ts)}</p>
      </div>
    </div>
  );
}

function ErrorBubble({ msg }: { msg: ErrorMessage }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-xl rounded-tl-sm border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{msg.text}</p>
        </div>
        <p className="mt-1 px-1 text-[11px] tabular-nums text-muted-foreground">
          {formatTime(msg.ts)}
        </p>
      </div>
    </div>
  );
}

function UserBubble({ msg }: { msg: UserMessage }) {
  return (
    <div className="flex flex-row-reverse gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <UserIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[75%] space-y-1">
        <div className="rounded-xl rounded-tr-sm border border-primary/20 bg-primary/10 px-4 py-3 shadow-sm">
          <p className="text-sm text-foreground">{msg.question}</p>
        </div>
        <p className="px-1 text-right text-[11px] tabular-nums text-muted-foreground">
          {formatTime(msg.ts)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-white shadow-sm shadow-primary/30">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-xl rounded-tl-sm border border-border/70 bg-card px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

let _id = 0;
function nextId() {
  return `msg-${++_id}`;
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: UserMessage = {
      id: nextId(),
      role: "user",
      question: q,
      ts: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const data: AiQueryResponse = await aiApi.query(q);
      const aiMsg: AiMessage = {
        id: nextId(),
        role: "assistant",
        question: data.question,
        chatResponse: data.chatResponse ?? null,
        sql: data.sql ?? null,
        rows: data.rows,
        rowCount: data.rowCount,
        ts: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      let text = "Something went wrong. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const resp = (err as { response?: { data?: { error?: string } } }).response;
        if (resp?.data?.error) text = resp.data.error;
      }
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "error", question: q, text, ts: new Date() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-sm shadow-primary/30">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Ask anything about your CRM data in plain English
          </p>
        </div>
        {messages.length > 0 && (
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {messages.filter((m) => m.role === "user").length} queries
          </Badge>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/70 bg-card shadow-sm">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-primary/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-medium">Ask your CRM anything</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Type a question in plain English. The AI translates it to SQL, runs it, and
                shows you the results.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border/70 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 px-4 py-5 md:px-6">
            {messages.map((msg) => {
              if (msg.role === "user") return <UserBubble key={msg.id} msg={msg} />;
              if (msg.role === "assistant") return <AiResponseBubble key={msg.id} msg={msg} />;
              return <ErrorBubble key={msg.id} msg={msg} />;
            })}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-3 flex gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. Which deals closed last month? (Enter to send, Shift+Enter for newline)"
          className="min-h-[2.5rem] max-h-36 resize-none border-0 bg-transparent p-1 text-sm shadow-none focus-visible:ring-0"
          rows={1}
          disabled={loading}
        />
        <Button
          onClick={() => submit(input)}
          disabled={!input.trim() || loading}
          size="icon"
          className="h-10 w-10 shrink-0 self-end bg-brand-gradient shadow-sm shadow-primary/30 hover:opacity-90"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
