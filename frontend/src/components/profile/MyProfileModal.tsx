import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Shield,
  KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthUser } from '@/store/auth.store'
import { useMyEmployeeProfile } from '@/hooks/use-api'
import { useUpdateMyProfile, useUpdateMyPassword } from '@/hooks/use-profile'

interface MyProfileModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'profile' | 'password'
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile',
}) => {
  const authUser = useAuthUser()
  const { data: myProfile } = useMyEmployeeProfile()

  const updateProfileMutation = useUpdateMyProfile()
  const updatePasswordMutation = useUpdateMyPassword()

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(defaultTab)

  // Profile Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Sync initial values from loaded employee profile or auth user
  useEffect(() => {
    if (myProfile) {
      setFirstName(myProfile.firstName || '')
      setLastName(myProfile.lastName || '')
      setPhone(myProfile.phone || '')
    } else if (authUser?.name) {
      const parts = authUser.name.split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
    }
  }, [myProfile, authUser])

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab, isOpen])

  if (!isOpen) return null

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim()) {
      toast.error('First Name is required.')
      return
    }

    try {
      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      })
      toast.success('Your profile information has been updated successfully!')
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update profile'
      toast.error(errMsg)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error('Please enter your current password.')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation password do not match.')
      return
    }

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      })
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to change password'
      toast.error(errMsg)
    }
  }

  const employeeCode = myProfile?.employeeCode || 'EMP-2026'
  const workEmail = myProfile?.email || authUser?.email || ''
  const departmentName = myProfile?.department?.name || 'General'
  const jobTitle = myProfile?.jobPosition?.title || 'Team Member'
  const roleName = (authUser?.role || 'Employee').replace('_', ' ').toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="pp-card w-full max-w-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-2xl rounded-[10px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-muted)]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-heading)] mb-0">
                My Profile & Account Settings
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-0">
                Update your personal details and manage your account password.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-muted)] rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-base)] flex items-center px-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'password'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Account Summary Banner */}
              <div className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)]/60 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--color-text-heading)] flex items-center gap-2">
                    <span>{firstName} {lastName}</span>
                    <span className="pp-badge pp-badge-neutral text-[10px] font-mono">{employeeCode}</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-3 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-[var(--color-text-muted)]" /> {jobTitle}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[var(--color-text-muted)]" /> {departmentName}
                    </span>
                  </div>
                </div>
                <span className="pp-badge pp-badge-success text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {roleName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-heading)] mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pp-input text-xs w-full py-2 px-3 rounded-[6px]"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-heading)] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pp-input text-xs w-full py-2 px-3 rounded-[6px]"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-heading)] mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pp-input text-xs pl-9 w-full py-2 rounded-[6px]"
                    placeholder="+91 98200 12345"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">
                  Work Email Address <span className="text-[10px] text-[var(--color-text-muted)] font-normal">(Managed by HR)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    value={workEmail}
                    readOnly
                    disabled
                    className="pp-input text-xs pl-9 w-full py-2 rounded-[6px] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="pp-btn-secondary text-xs py-2 px-4 rounded-[6px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="pp-btn-primary text-xs py-2 px-5 rounded-[6px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Note:</strong> Passwords must be at least 6 characters long. Make sure to choose a strong password to protect your account.
                </span>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-heading)] mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pp-input text-xs pl-9 pr-10 w-full py-2 rounded-[6px]"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-heading)] mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pp-input text-xs pl-9 pr-10 w-full py-2 rounded-[6px]"
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-heading)] mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pp-input text-xs pl-9 pr-10 w-full py-2 rounded-[6px]"
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="pp-btn-secondary text-xs py-2 px-4 rounded-[6px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  className="pp-btn-primary text-xs py-2 px-5 rounded-[6px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updatePasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
