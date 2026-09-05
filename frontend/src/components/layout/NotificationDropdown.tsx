/**
 * NotificationDropdown — Real-Time Notification Bell & Live Socket Panel
 * Displays live WebSocket connection status, unread counter, and recent session notifications.
 */
import React, { useState, useRef, useEffect } from 'react'
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Activity,
  Trash2,
  CheckCheck,
} from 'lucide-react'
import { useSocket } from '@/socket/SocketProvider'

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    isConnected,
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    sendCheck,
  } = useSocket()

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        markAllAsRead()
      }
      return next
    })
  }

  const getCategoryIcon = (category?: string, type?: string) => {
    switch (category) {
      case 'timeoff':
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      case 'attendance':
        return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'payroll':
        return <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      case 'employee':
        return <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      default:
        if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        if (type === 'error') return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        return <Info className="w-4 h-4 text-[var(--color-primary)]" />
    }
  }

  const formatTimestamp = (ts?: string) => {
    if (!ts) return 'Just now'
    try {
      const date = new Date(ts)
      const diffMs = Date.now() - date.getTime()
      const diffSecs = Math.floor(diffMs / 1000)
      if (diffSecs < 60) return `${Math.max(1, diffSecs)}s ago`
      const diffMins = Math.floor(diffSecs / 60)
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Recent'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-1.5 rounded-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] transition-colors cursor-pointer relative"
        title="Live WebSocket Notifications & Status"
      >
        <Bell className="w-4 h-4" />

        {/* Live Socket Status Dot */}
        <span
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[var(--color-bg-base)] ${
            isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
          title={isConnected ? 'WebSocket: Connected (Live)' : 'WebSocket: Reconnecting...'}
        />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-muted)]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-heading)]">Notifications</span>
              {/* Live Connection Tag */}
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                  }`}
                />
                <span>{isConnected ? 'Live' : 'Reconnecting'}</span>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => sendCheck()}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-base)] rounded transition-colors"
                title="Test WebSocket Ping"
              >
                <Activity className="w-3.5 h-3.5" />
              </button>
              {notifications.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-base)] rounded transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="p-1 text-[var(--color-text-muted)] hover:text-rose-600 hover:bg-[var(--color-bg-base)] rounded transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)]">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-[var(--color-text-heading)]">No live notifications yet</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Real-time events from payroll, attendance, and leave requests will appear here automatically.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 transition-colors hover:bg-[var(--color-bg-muted)]/40 flex items-start gap-2.5 ${
                    !notif.read ? 'bg-[var(--color-primary)]/5' : ''
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[var(--color-bg-muted)] shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category, notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-[var(--color-text-heading)] truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap shrink-0">
                        {formatTimestamp(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-[var(--color-bg-muted)]/30 border-t border-[var(--color-border)] text-center text-[10px] text-[var(--color-text-muted)]">
            Connected to PeoplePay360 Real-Time Gateway
          </div>
        </div>
      )}
    </div>
  )
}
