/**
 * SocketProvider — Global WebSocket Context Provider for PeoplePay360
 * Manages socket lifecycle, real-time notifications, and automated React Query cache invalidation.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useToken, useAuthUser, useCompanyId } from '@/store/auth.store'
import { initSocketClient, disconnectSocket, type TypedSocket } from './socket.client'
import type {
  SocketNotificationPayload,
  TimeOffEventPayload,
  AttendanceEventPayload,
  PayrunEventPayload,
  PayslipAvailablePayload,
  DashboardMetricsInvalidatedPayload,
} from './socket.types'

export interface SocketContextValue {
  socket: TypedSocket | null
  isConnected: boolean
  lastPing: string | null
  notifications: SocketNotificationPayload[]
  unreadCount: number
  markAllAsRead: () => void
  clearNotifications: () => void
  sendCheck: (message?: string) => void
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  lastPing: null,
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => {},
  clearNotifications: () => {},
  sendCheck: () => {},
})

const MAX_NOTIFICATIONS = 50

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient()
  const token = useToken()
  const user = useAuthUser()
  const companyId = useCompanyId()

  const [socket, setSocket] = useState<TypedSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastPing, setLastPing] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<SocketNotificationPayload[]>([])

  // Store notifications in session storage to persist across page refresh
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('pp-socket-notifications')
      if (cached) {
        setNotifications(JSON.parse(cached))
      }
    } catch {
      // ignore JSON parse error
    }
  }, [])

  const saveNotifications = useCallback((updater: (prev: SocketNotificationPayload[]) => SocketNotificationPayload[]) => {
    setNotifications((prev) => {
      const next = updater(prev).slice(0, MAX_NOTIFICATIONS)
      try {
        sessionStorage.setItem('pp-socket-notifications', JSON.stringify(next))
      } catch {
        // ignore storage error
      }
      return next
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    saveNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [saveNotifications])

  const clearNotifications = useCallback(() => {
    saveNotifications(() => [])
  }, [saveNotifications])

  // Connection Lifecycle
  useEffect(() => {
    if (!token || !user) {
      disconnectSocket()
      setSocket(null)
      setIsConnected(false)
      return
    }

    const s = initSocketClient({
      token,
      userId: user.id,
      clerkUserId: user.id,
      role: user.role,
      companyId,
      employeeId: user.employeeId,
    })

    setSocket(s)

    const onConnect = () => {
      setIsConnected(true)
      // Send handshake check
      s.emit('client:check', { message: 'Web UI handshake completed' })
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }

    const onConnectError = (err: Error) => {
      setIsConnected(false)
      console.warn('[Socket:Client] Connection error:', err.message)
    }

    const onServerCheck = (data: { timestamp: string }) => {
      setLastPing(data.timestamp)
    }

    // ── Real-Time Notification Handler ─────────────────────────
    const onNotification = (data: SocketNotificationPayload) => {
      const newNotif: SocketNotificationPayload = {
        ...data,
        id: data.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      }

      saveNotifications((prev) => [newNotif, ...prev])

      // Trigger Sonner toast based on type
      const title = data.title || 'System Notification'
      const desc = data.message || ''

      switch (data.type) {
        case 'success':
          toast.success(title, { description: desc })
          break
        case 'warning':
          toast.warning(title, { description: desc })
          break
        case 'error':
          toast.error(title, { description: desc })
          break
        default:
          toast.info(title, { description: desc })
          break
      }
    }

    // ── Domain Event Invalidation Handlers ───────────────────────

    // 1. Time Off Events
    const onTimeOffChange = (_payload: TimeOffEventPayload) => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }

    // 2. Attendance Events
    const onAttendanceChange = (_payload: AttendanceEventPayload) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }

    // 3. Payroll & Payrun Events
    const onPayrunChange = (payload: PayrunEventPayload) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      if (payload.status === 'computed') {
        toast.info('Payrun Computation Completed', {
          description: `Batch ${payload.name} has finished computation (${payload.totalEmployees || 0} employees).`,
        })
      } else if (payload.status === 'paid') {
        toast.success('Payrun Finalized & Paid', {
          description: `Batch ${payload.name} has been processed and paid.`,
        })
      }
    }

    const onPayslipAvailable = (_payload: PayslipAvailablePayload) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payouts'] })
      toast.info('New Payslip Available', {
        description: 'A new payslip is available in your Payout History.',
      })
    }

    // 4. Dashboard Metrics Invalidation
    const onDashboardInvalidated = (_data: DashboardMetricsInvalidatedPayload) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }

    // Register event listeners
    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('connect_error', onConnectError)
    s.on('server:check', onServerCheck)
    s.on('notification', onNotification)

    // Time Off
    s.on('timeoff:request:created', onTimeOffChange)
    s.on('timeoff:request:approved', onTimeOffChange)
    s.on('timeoff:request:refused', onTimeOffChange)
    s.on('timeoff:request:cancelled', onTimeOffChange)
    s.on('timeoff:request:updated', onTimeOffChange)

    // Attendance
    s.on('attendance:checkin', onAttendanceChange)
    s.on('attendance:checkout', onAttendanceChange)
    s.on('attendance:request:created', onAttendanceChange)
    s.on('attendance:request:approved', onAttendanceChange)
    s.on('attendance:request:refused', onAttendanceChange)
    s.on('attendance:updated', onAttendanceChange)

    // Payroll
    s.on('payroll:payrun:status_changed', onPayrunChange)
    s.on('payroll:payrun:computed', onPayrunChange)
    s.on('payroll:payrun:validated', onPayrunChange)
    s.on('payroll:payrun:paid', onPayrunChange)
    s.on('payroll:payslip:available', onPayslipAvailable)

    // Dashboard
    s.on('dashboard:metrics:invalidated', onDashboardInvalidated)

    // Connect socket
    s.connect()

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.off('connect_error', onConnectError)
      s.off('server:check', onServerCheck)
      s.off('notification', onNotification)
      s.off('timeoff:request:created', onTimeOffChange)
      s.off('timeoff:request:approved', onTimeOffChange)
      s.off('timeoff:request:refused', onTimeOffChange)
      s.off('timeoff:request:cancelled', onTimeOffChange)
      s.off('timeoff:request:updated', onTimeOffChange)
      s.off('attendance:checkin', onAttendanceChange)
      s.off('attendance:checkout', onAttendanceChange)
      s.off('attendance:request:created', onAttendanceChange)
      s.off('attendance:request:approved', onAttendanceChange)
      s.off('attendance:request:refused', onAttendanceChange)
      s.off('attendance:updated', onAttendanceChange)
      s.off('payroll:payrun:status_changed', onPayrunChange)
      s.off('payroll:payrun:computed', onPayrunChange)
      s.off('payroll:payrun:validated', onPayrunChange)
      s.off('payroll:payrun:paid', onPayrunChange)
      s.off('payroll:payslip:available', onPayslipAvailable)
      s.off('dashboard:metrics:invalidated', onDashboardInvalidated)

      disconnectSocket()
    }
  }, [token, user?.id, user?.role, companyId, queryClient, saveNotifications])

  const sendCheck = useCallback((message = 'Manual ping from UI') => {
    if (socket && isConnected) {
      socket.emit('client:check', { message }, (res: any) => {
        toast.success('WebSocket Connection Healthy', {
          description: typeof res === 'object' && res !== null ? 'Echo received from backend server' : 'Connected',
        })
      })
    } else {
      toast.error('WebSocket Disconnected', {
        description: 'Cannot ping: socket is currently offline.',
      })
    }
  }, [socket, isConnected])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastPing,
        notifications,
        unreadCount,
        markAllAsRead,
        clearNotifications,
        sendCheck,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

/**
 * Hook to consume Socket context anywhere in frontend
 */
export const useSocket = (): SocketContextValue => useContext(SocketContext)

/**
 * Helper hook to register a component-level socket listener with automatic cleanup
 */
export function useSocketEvent<T = any>(
  eventName: string,
  handler: (data: T) => void
) {
  const { socket } = useSocket()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!socket) return

    const listener = (data: T) => {
      handlerRef.current(data)
    }

    socket.on(eventName, listener)
    return () => {
      socket.off(eventName, listener)
    }
  }, [socket, eventName])
}
