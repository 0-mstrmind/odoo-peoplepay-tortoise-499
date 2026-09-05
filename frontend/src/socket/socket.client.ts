/**
 * Socket Client Instance Manager
 * Creates, configures and manages the Socket.io client connection.
 */
import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from './socket.types'

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socketInstance: TypedSocket | null = null

/**
 * Resolves the Socket.io server URL based on runtime environment variables
 */
export const getSocketUrl = (): string => {
  const customUrl = import.meta.env.VITE_SOCKET_URL
  if (customUrl) return customUrl

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'
  try {
    const url = new URL(apiUrl)
    return url.origin
  } catch {
    return 'http://localhost:4000'
  }
}

export interface SocketAuthParams {
  token?: string | null
  userId?: string | null
  clerkUserId?: string | null
  role?: string | null
  companyId?: string | null
  employeeId?: string | null
}

/**
 * Initializes or reconfigures the global Socket.io client
 */
export const initSocketClient = (params?: SocketAuthParams): TypedSocket => {
  if (socketInstance) {
    if (socketInstance.connected) {
      return socketInstance
    }
    socketInstance.disconnect()
    socketInstance = null
  }

  const serverUrl = getSocketUrl()
  const authPayload: Record<string, any> = {}

  if (params?.token) {
    authPayload.token = params.token.startsWith('Bearer ') ? params.token : `Bearer ${params.token}`
  }
  if (params?.userId) {
    authPayload.userId = params.userId
    authPayload.clerkUserId = params.userId
  }
  if (params?.role) {
    authPayload.role = params.role
  }
  if (params?.companyId) {
    authPayload.companyId = params.companyId
  }
  if (params?.employeeId) {
    authPayload.employeeId = params.employeeId
  }

  const extraHeaders: Record<string, string> = {}
  if (params?.userId) extraHeaders['x-user-id'] = String(params.userId)
  if (params?.role) extraHeaders['x-user-role'] = String(params.role)
  if (params?.companyId) extraHeaders['x-company-id'] = String(params.companyId)

  socketInstance = io(serverUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: authPayload,
    extraHeaders,
  }) as TypedSocket

  return socketInstance
}

/**
 * Returns active socket instance
 */
export const getSocket = (): TypedSocket | null => socketInstance

/**
 * Disconnects and cleans up socket
 */
export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
