import React, { useRef, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

interface Props {
  lang: 'en' | 'ar';
}

function timeAgo(isoString: string, lang: 'en' | 'ar'): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (lang === 'ar') {
    if (mins  <  1)  return 'الآن';
    if (mins  < 60)  return `منذ ${mins} دقيقة`;
    if (hours < 24)  return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  }
  if (mins  <  1)  return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationsBell({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markOneRead, markAllRead } = useNotifications(true);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function handleOpen() {
    setOpen(v => !v);
  }

  function handleMarkAllRead() {
    markAllRead();
  }

  function handleItemClick(n: AppNotification) {
    if (!n.read) markOneRead(n.id);
  }

  const panelAlign = lang === 'ar' ? 'left-0' : 'right-0';

  return (
    <div ref={panelRef} className="relative" style={{ display: 'inline-flex' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-white/80 hover:text-[#C9A84C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={`absolute top-full mt-2 ${panelAlign} w-80 max-w-[calc(100vw-2rem)] bg-white border border-border rounded-2xl shadow-2xl z-50 overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[13px] font-bold text-gray-800">
              {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-primary hover:text-primary/70 transition-colors"
              >
                {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications yet'}
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-primary/5 focus:outline-none focus-visible:bg-primary/5 ${!n.read ? 'bg-blue-50/60' : ''}`}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-start gap-2">
                    {/* Unread dot */}
                    <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                        {n.body}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {timeAgo(n.createdAt, lang)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
