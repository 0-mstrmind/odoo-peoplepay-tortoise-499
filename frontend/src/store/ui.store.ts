/**
 * Zustand UI Store — PeoplePay360
 *
 * Manages ephemeral UI state that should NOT be persisted.
 *
 * Slices:
 *  - sidebarOpen        Global sidebar collapse state
 *  - activeModal        Currently open modal identifier (null = none)
 *  - toasts             Toast notification queue (managed by sonner separately)
 *
 * Usage:
 *  const { sidebarOpen, toggleSidebar } = useUIStore()
 */
import { create } from 'zustand'

type ModalId = string | null

interface UIState {
  sidebarOpen:   boolean
  activeModal:   ModalId
}

interface UIActions {
  toggleSidebar:  () => void
  setSidebar:     (open: boolean) => void
  openModal:      (id: string) => void
  closeModal:     () => void
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  // ── State ──────────────────────────────────────────────────
  sidebarOpen: true,
  activeModal: null,

  // ── Actions ────────────────────────────────────────────────
  toggleSidebar:  () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar:     (open) => set({ sidebarOpen: open }),
  openModal:      (id) => set({ activeModal: id }),
  closeModal:     () => set({ activeModal: null }),
}))

// ── Selectors ──────────────────────────────────────────────────────────────
export const useSidebarOpen = () => useUIStore((s) => s.sidebarOpen)
export const useActiveModal = () => useUIStore((s) => s.activeModal)