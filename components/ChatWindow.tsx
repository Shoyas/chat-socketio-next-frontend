"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "../lib/socket";

type RawMessage = { id: string; from: string; to: string; text: string; ts: number };
type UiStatus = "sending" | "sent" | "delivered" | "read";

type UiMessage = RawMessage & {
  tempId?: string;
  status?: UiStatus;
};

export default function ChatWindow({
  meId,
  otherId,
  otherName,
}: {
  meId: string;
  otherId: string;
  otherName: string;
}) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [text, setText] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oldestTs = useRef<number | null>(null);
  const room = useMemo(() => [meId, otherId].sort().join(":"), [meId, otherId]);

  const scrollToBottom = useCallback((smooth = true) => {
    listRef.current?.scrollTo({ top: 9e9, behavior: smooth ? "smooth" : "auto" });
  }, []);

  /** De-dup guard by id */
  const mergeMessages = useCallback((incoming: UiMessage[]) => {
    setMessages((prev) => {
      const byId = new Map<string, UiMessage>(prev.map((m) => [m.id, m]));
      for (const m of incoming) {
        byId.set(m.id, { ...byId.get(m.id), ...m });
      }
      return Array.from(byId.values()).sort((a, b) => a.ts - b.ts);
    });
  }, []);

  /** Initial history (paginated) */
  useEffect(() => {
    setMessages([]);
    oldestTs.current = null;
    const load = async () => {
      // `http://localhost:4000/api/messages/${meId}/${otherId}` ||
      // const url = new URL(`http://10.0.30.40:4000/api/messages/${meId}/${otherId}`);
      // const url = new URL(`${process.env.DOMAIN_URL}/api/messages/${meId}/${otherId}`);
      const url = new URL(`https://chat-socketio-express-backend.onrender.com/api/messages/${meId}/${otherId}`);
      url.searchParams.set("limit", "50");
      const r = await fetch(url.toString());
      const data: RawMessage[] = await r.json();
      if (data.length) oldestTs.current = data[0].ts;
      mergeMessages(
        data.map((m) => ({
          ...m,
          status: m.from === meId ? "sent" : undefined,
        }))
      );
      // `http://localhost:4000/api/threads/${meId}/read/${otherId}` ||
      // mark read for anything visible
      // await fetch(`http://10.0.30.40:4000/api/threads/${meId}/read/${otherId}`, { method: "POST" }).catch(() => { });
      // await fetch(`${process.env.DOMAIN_URL}/api/threads/${meId}/read/${otherId}`, { method: "POST" }).catch(() => { });
      await fetch(`https://chat-socketio-express-backend.onrender.com/api/threads/${meId}/read/${otherId}`, { method: "POST" }).catch(() => { });
      scrollToBottom(false);
    };
    load();
  }, [meId, otherId, mergeMessages, scrollToBottom]);

  /** Socket wiring */
  useEffect(() => {
    const s = getSocket();

    // Join presence + thread room
    s.emit("join", { userId: meId, otherId });

    const onNew = (m: RawMessage) => {
      // Only accept for this thread
      if (
        (m.from === meId && m.to === otherId) ||
        (m.from === otherId && m.to === meId)
      ) {
        mergeMessages([{ ...m }]);

        // If received by me, confirm delivery and mark read (active chat)
        if (m.to === meId) {
          s.emit("message:received", { id: m.id, by: meId });
          // Mark read immediately (active open thread)
          s.emit("message:read", { id: m.id, by: meId });
        }
      }
    };

    const onAck = ({ tempId, id, ts }: { tempId: string; id: string; ts: number }) => {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, id, ts, status: "sent" } : m))
      );
    };

    const onDelivered = ({ id, by }: { id: string; by: string }) => {
      if (by === otherId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id && m.from === meId ? { ...m, status: "delivered" } : m))
        );
      }
    };

    const onRead = ({ id, by }: { id: string; by: string }) => {
      if (by === otherId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id && m.from === meId ? { ...m, status: "read" } : m))
        );
      }
    };

    const onTyping = (payload: { room: string; from: string; isTyping: boolean }) => {
      if (payload.room === room && payload.from === otherId) {
        setIsOtherTyping(payload.isTyping);
      }
    };

    s.on("message:new", onNew);
    s.on("message:ack", onAck);
    s.on("message:delivered", onDelivered);
    s.on("message:read", onRead);
    s.on("typing", onTyping);

    return () => {
      s.off("message:new", onNew);
      s.off("message:ack", onAck);
      s.off("message:delivered", onDelivered);
      s.off("message:read", onRead);
      s.off("typing", onTyping);
    };
  }, [meId, otherId, room, mergeMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /** Typing emitter */
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const s = getSocket();
      s.emit("typing", { room, from: meId, isTyping });
    },
    [room, meId]
  );

  /** Input handlers */
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    emitTyping(true);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1200);
  }

  /** Send pipeline: temp message -> ack -> delivered/read */
  function send() {
    const t = text.trim();
    if (!t) return;
    const tempId = `temp-${Date.now()}`;
    const now = Date.now();
    const optimistic: UiMessage = {
      id: tempId, // temporary id for de-dupe
      tempId,
      from: meId,
      to: otherId,
      text: t,
      ts: now,
      status: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");

    const s = getSocket();
    s.emit("message:send", { tempId, from: meId, to: otherId, text: t });
  }

  /** Simple ticks UI */
  const renderTicks = (m: UiMessage) => {
    if (m.from !== meId) return null;
    const base = "ml-2 text-[10px]";
    if (m.status === "read") return <span className={`${base} text-blue-600`}>✓✓</span>;
    if (m.status === "delivered") return <span className={`${base} text-gray-600`}>✓✓</span>;
    if (m.status === "sent") return <span className={`${base} text-gray-600`}>✓</span>;
    return <span className={`${base} text-gray-400`}>…</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="font-semibold text-lg">{otherName}</div>
        <div className="text-xs text-gray-500">{isOtherTyping ? "typing..." : "online"}</div>
      </div>

      <div className="flex-1 overflow-auto p-4" ref={listRef}>
        <div className="space-y-4">
          {messages.map((m) => {
            const mine = m.from === meId;
            return (
              <div
                key={m.id}
                className={`max-w-xs p-2 rounded ${mine ? "ml-auto bg-green-500 text-white" : "bg-white border"
                  }`}
                title={new Date(m.ts).toLocaleString()}
              >
                <div className="text-sm flex items-end">
                  <span>{m.text}</span>
                  {renderTicks(m)}
                </div>
                <div className={`text-xs mt-1 ${mine ? "text-green-50/90" : "text-gray-600"}`}>
                  {new Date(m.ts).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t flex items-center gap-2">
        <input
          value={text}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type a message"
        />
        <button onClick={send} className="px-4 py-2 bg-sky-700 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
}
