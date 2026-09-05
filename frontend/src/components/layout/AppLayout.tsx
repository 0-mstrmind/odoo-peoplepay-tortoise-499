import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { MyProfileModal } from '../profile/MyProfileModal'
import { useAuthStore, useAuthUser } from '@/store/auth.store'

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'password'>('profile')

  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  // Listen to 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
      navigate('/login', { replace: true, state: { sessionExpired: true } })
      toast.error('Session expired. Please sign in again.')
    }
    window.addEventListener('pp:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('pp:unauthorized', handleUnauthorized)
  }, [logout, navigate])

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setIsSidebarCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpenProfileModal = (tab: 'profile' | 'password' = 'profile') => {
    setProfileModalTab(tab)
    setIsProfileModalOpen(true)
  }

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
    toast.info('Signed out successfully')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col">
      {/* Sidebar Navigation */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        user={user}
        onSignOut={handleSignOut}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {/* Main Content Area offset by Sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        {/* Top Header Bar */}
        <AppHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          user={user}
          onOpenProfileModal={handleOpenProfileModal}
        />

        {/* View Workspace Container */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <Outlet context={{ onOpenProfileModal: handleOpenProfileModal }} />
        </main>
      </div>

      {/* My Profile & Security Modal */}
      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultTab={profileModalTab}
      />

      <Toaster position="top-right" richColors />
    </div>
  )
}

