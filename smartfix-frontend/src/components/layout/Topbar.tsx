"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { api, Notification } from "@/lib/api";

export function Topbar() {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.notifications.list().then((res) => {
      setNotifications(res.notifications);
      setUnread(res.unreadCount);
    }).catch(() => {});
  }, []);

  return (
    <header className="h-14 flex items-center justify-end px-6 border-b border-border bg-background sticky top-0 z-20">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors text-sm"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">Notifications</span>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-semibold text-sm">Notifications</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${!n.isRead ? "bg-primary/5" : ""}`}>
                    <p className="text-sm text-foreground">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </header>
  );
}
