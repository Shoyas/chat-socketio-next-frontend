"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

type ThreadSummary = {
  otherId: string;
  otherName: string;
  lastText: string;
  lastTs: number;
  unread: number;
};

export default function RecentContactsSidebar({
  meId,
  selected,
}: {
  meId: string;
  selected?: string;
}) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // const r = await fetch(`http://localhost:4000/api/threads/${meId}`);
      // const r = await fetch(`http://10.0.30.40:4000/api/threads/${meId}`);
      const r = await fetch(`${process.env.DOMAIN_URL}/api/threads/${meId}`);
      const data: ThreadSummary[] = await r.json();
      setThreads(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [meId]);

  useEffect(() => {
    const s = getSocket();
    const refresh = () => load();
    s.on("message:new", refresh);
    s.on("message:delivered", refresh);
    s.on("message:read", refresh);
    return () => {
      s.off("message:new", refresh);
      s.off("message:delivered", refresh);
      s.off("message:read", refresh);
    };
  }, [meId]);

  return (
    <aside className="w-72 border-r p-4 h-full overflow-auto">
      <h3 className="text-center font-semibold mb-4">Contact Our Specialists</h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 rounded-md border bg-gray-50" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-sm text-gray-500 text-center">
          No conversations yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {threads.map((t) => {
            const isActive = selected === t.otherId;
            return (
              <Link
                key={t.otherId}
                href={`/chat/${t.otherId}?as=${encodeURIComponent(meId)}`}
                className={`block rounded-md border p-3 hover:shadow-sm transition ${isActive ? "border-sky-600 ring-1 ring-sky-600" : "border-gray-200"
                  }`}
              >
                <div className="text-xs text-gray-500">{`Card-${t.otherId}`}</div>
                <div className="font-semibold">{t.otherName}</div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-xs text-gray-600 truncate max-w-[140px]">{t.lastText}</div>
                  {t.unread > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center text-xs bg-sky-600 text-white rounded-full px-2 h-5">
                      {t.unread}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-sky-700">Send Text</div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
