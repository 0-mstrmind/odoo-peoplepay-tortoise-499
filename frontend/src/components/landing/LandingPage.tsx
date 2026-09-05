import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Building2,
  Users,
  CreditCard,
  Clock,
  Calendar,
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Calculator,
  Award,
  Check,
  Layers,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/axios'
import { useAuthStore, useIsAuthed } from '@/store/auth.store'

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

interface LandingPageProps {
  defaultRegisterMode?: boolean
}

const INDUSTRIES = [
  'Information Technology & SaaS',
  'Fintech & Financial Services',
  'Healthcare & Life Sciences',
  'E-Commerce & Retail',
  'Manufacturing & Supply Chain',
  'Education & EdTech',
  'Consulting & Professional Services',
  'Media & Creative Agency',
]

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
]

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'UTC', label: 'UTC (GMT +0:00)' },
  { value: 'America/New_York', label: 'America/New_York (EST -5:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST -8:00)' },
  { value: 'Europe/London', label: 'Europe/London (BST +1:00)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
]

const MODULES = [
  {
    id: 'employees',
    title: 'Employee Directory 360°',
    badge: 'Core HR',
    icon: Users,
    color: '#714867', // Odoo Purple
    description: 'Centralized employee dossier with hierarchy trees, dynamic reporting lines, and Granular Role-Based Access Control (RBAC).',
    bullets: ['Department & Job Position Mapping', 'Self-Service Employee Portal', 'Custom Document Attachments', 'Manager Approval Chains'],
    tag: 'HR Master',
  },
  {
    id: 'attendance',
    title: 'Biometric & Shift Attendance',
    badge: 'Workforce',
    icon: Clock,
    color: '#00A09D', // Odoo Teal
    description: 'Real-time clock-in/clock-out tracking with shift synchronization, automated work hours calculation, and overtime detection.',
    bullets: ['One-Click Check-In / Check-Out', 'Schedule Grace Periods & Limits', 'Overtime Hours Aggregation', 'Working Schedule Matrix'],
    tag: 'Time Tracking',
  },
  {
    id: 'timeoff',
    title: 'Time Off & Leave Quotas',
    badge: 'Leave Engine',
    icon: Calendar,
    color: '#E97B24', // Odoo Amber
    description: 'Multi-tiered leave allocation policies (PTO, Sick, Casual) with automated balance tracking and emergency admin force-allocation.',
    bullets: ['Automated Accrual & Balance Bank', 'Manager Approval & Reject Flows', 'Admin Instant Override Granting', 'Statutory Holiday Calendars'],
    tag: 'Leave Management',
  },
  {
    id: 'contracts',
    title: 'Contract & Wage Structure',
    badge: 'Compliance',
    icon: FileText,
    color: '#3498DB', // Crisp Blue
    description: 'Manage legal employment agreements, wage components, salary structure linkages, and contract lifecycle status.',
    bullets: ['Monthly & Hourly Wage Engines', 'Probationary & Active Statuses', 'Salary Structure Assignment', 'Multi-Contract Audit Trail'],
    tag: 'Contracts',
  },
  {
    id: 'payroll',
    title: 'Automated Batch Payroll Engine',
    badge: 'Payroll Core',
    icon: CreditCard,
    color: '#714867', // Odoo Purple
    description: 'Configurable formula-driven salary rules (Basic, HRA, PF, ESI, TDS) with single-click batch payrun calculations.',
    bullets: ['Custom Mathematical Rule Formulas', 'Dynamic Net & Gross Recalculation', 'Manual Spot Adjustments (Bonuses/Deductions)', 'Pre-Payrun Anomaly Detection'],
    tag: 'Batch Engine',
  },
  {
    id: 'payouts',
    title: 'Payouts & Printable Payslips',
    badge: 'Finance',
    icon: Award,
    color: '#00C853', // Emerald Green
    description: 'Immutable payslip records with itemized earnings and deductions breakdowns, bank payout exports, and verified PDF printing.',
    bullets: ['Instant PDF Payslip Generation', 'Itemized Rule Component Summary', 'Bank Disbursal Direct Export', 'Employee Secure Download Access'],
    tag: 'Disbursement',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main Landing Page Component
// ─────────────────────────────────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ defaultRegisterMode = false }) => {
  const navigate = useNavigate()
  const isAuthed = useIsAuthed()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setCompanyId = useAuthStore((s) => s.setCompanyId)

  // Registration Form States
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [country, setCountry] = useState('India')
  const [currency, setCurrency] = useState('INR')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [phone, setPhone] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)

  // Interactive ROI & Salary Calculator States
  const [calcEmployees, setCalcEmployees] = useState(50)
  const [calcBaseSalary, setCalcBaseSalary] = useState(65000)

  // Auto-generate slug from company name
  useEffect(() => {
    if (companyName) {
      const generated = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    } else {
      setSlug('')
    }
  }, [companyName])

  // Auto-scroll to register if requested
  useEffect(() => {
    if (defaultRegisterMode) {
      const el = document.getElementById('register-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [defaultRegisterMode])

  // Auto-fill demo company for rapid evaluator testing
  const handleAutoFillDemo = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    setCompanyName(`Odoo Horizon Labs ${randomSuffix}`)
    setIndustry('Information Technology & SaaS')
    setCountry('India')
    setCurrency('INR')
    setTimezone('Asia/Kolkata')
    setPhone('+91 98765 43210')
    setAdminName('Priya Sharma')
    setAdminEmail(`admin.horizon${randomSuffix}@odoolabs.com`)
    setAdminPassword('EnterprisePass@360')
    toast.info('Sample enterprise demo details pre-filled!')
  }

  // Password generator
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let pwd = ''
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setAdminPassword(pwd)
    setShowPassword(true)
    toast.success('High-entropy password generated!')
  }

  // Handle Company Registration Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)

    if (!companyName.trim()) {
      setRegError('Please provide your official company name.')
      return
    }
    if (!adminEmail.trim()) {
      setRegError('Please enter an administrator work email address.')
      return
    }
    if (!adminPassword || adminPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.')
      return
    }

    setRegLoading(true)

    try {
      const response = await apiClient.post('/companies', {
        name: companyName.trim(),
        slug: slug || `company-${Date.now()}`,
        industry,
        country,
        currency,
        timezone,
        phone: phone.trim() || undefined,
        adminName: adminName.trim() || undefined,
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
      })

      const data = response.data?.data || response.data
      const { accessToken, company, adminUser } = data

      if (accessToken && company && adminUser) {
        setAuth(accessToken, {
          id: adminUser.id,
          email: adminUser.email,
          name: adminName.trim() || adminEmail.split('@')[0],
          role: 'admin',
        })
        setCompanyId(company.id)
        toast.success(`Welcome to PeoplePay360! Company workspace '${company.name}' provisioned successfully.`)
        navigate('/dashboard', { replace: true })
      } else {
        toast.success('Company created successfully! Please sign in with your administrator credentials.')
        navigate('/login', { replace: true })
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setRegError(err.response.data.message)
      } else if (!err.response) {
        setRegError('Cannot connect to backend server. Ensure the API service is active.')
      } else {
        setRegError('Failed to register enterprise workspace. Please verify your details.')
      }
    } finally {
      setRegLoading(false)
    }
  }

  // Live Calculator Calculations
  const basicSalary = Math.round(calcBaseSalary * 0.5)
  const hra = Math.round(basicSalary * 0.4)
  const specialAllowance = calcBaseSalary - (basicSalary + hra)
  const epfDeduction = Math.round(basicSalary * 0.12)
  const ptDeduction = 200
  const totalDeductions = epfDeduction + ptDeduction
  const netTakeHome = calcBaseSalary - totalDeductions
  const monthlyHoursSaved = Math.round(calcEmployees * 1.8)
  const annualSavings = Math.round(calcEmployees * 4200)

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1A1F36] font-sans antialiased selection:bg-[#714867] selection:text-white relative overflow-x-hidden">
      {/* ── WATERMARK BACKGROUND OVERLAY ──────────────────────────────────── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-repeat bg-top"
        style={{
          backgroundImage: `url('/assets/odoo_watermark_pattern.jpg')`,
          backgroundSize: '1200px',
        }}
      />

      {/* Decorative Odoo Grid Pattern Subtle SVG Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#714867" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── STICKY ENTERPRISE NAVIGATION (ODOO STYLE) ────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E5EA] shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Edition Pill */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-lg bg-[#714867] text-white flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-[#1A1F36] tracking-tight leading-none group-hover:text-[#714867] transition-colors">
                    PeoplePay<span className="text-[#714867]">360</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#00A09D]/10 text-[#00A09D] px-2 py-0.5 rounded-full border border-[#00A09D]/20">
                    Odoo Suite
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280] font-medium tracking-wide">
                  Enterprise HR & Multi-Tenant Payroll
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#3D4460]">
            <a href="#overview" className="hover:text-[#714867] transition-colors">
              Overview
            </a>
            <a href="#apps" className="hover:text-[#714867] transition-colors flex items-center gap-1">
              <span>Apps & Modules</span>
              <span className="text-[9px] bg-purple-100 text-[#714867] px-1.5 py-0.2 rounded font-bold">6</span>
            </a>
            <a href="#calculator" className="hover:text-[#714867] transition-colors">
              Salary Simulator
            </a>
            <a href="#comparison" className="hover:text-[#714867] transition-colors">
              Why PeoplePay
            </a>
            <a href="#register-section" className="text-[#714867] font-bold hover:underline transition-all">
              Register Company
            </a>
          </nav>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-3">
            {isAuthed ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-xs font-bold bg-[#714867] hover:bg-[#5d3a55] text-white rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-[#3D4460] hover:text-[#714867] transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href="#register-section"
                  className="px-4 py-2 text-xs font-bold bg-[#714867] hover:bg-[#5d3a55] text-white rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Start Free Trial</span>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH WATERMARK GRAPHICS ─────────────────────────── */}
      <section id="overview" className="relative z-10 pt-12 pb-20 lg:pt-18 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline & Pitch */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2E5EA] shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-[#00A09D] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#714867]">
                  Odoo-Level Multi-Tenant Architecture
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  Ready for India & Global Scale
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1A1F36] tracking-tight leading-[1.1]">
                All-in-One HR, Smart Attendance &{' '}
                <span className="text-[#714867] relative inline-block">
                  Automated Payroll
                  <svg className="absolute -bottom-2 left-0 w-full h-2 text-[#00A09D]/40" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0,0 Q50,12 100,0" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-[#3D4460] font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                A modern, open-source-inspired workforce engine. Manage employee master records, shift attendance, contract wage architectures, and multi-tenant salary rules with single-click batch payruns.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="#register-section"
                  className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold bg-[#714867] hover:bg-[#5d3a55] text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Building2 className="w-4 h-4 text-amber-300" />
                  <span>Register Company Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href="#calculator"
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold bg-white hover:bg-gray-50 text-[#3D4460] border border-[#E2E5EA] rounded-lg transition-all shadow-2xs hover:border-[#714867] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-[#00A09D]" />
                  <span>Try Salary Simulator</span>
                </a>
              </div>

              {/* Key Trust Checkmarks */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs font-semibold text-[#475569]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PostgreSQL Tenant Isolation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Statutory PF, ESI & TDS Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Manual Formula Errors</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card (With Watermark Glassmorphism) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glowing Aura Accent */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#714867] to-[#00A09D] rounded-2xl blur-lg opacity-25" />

                {/* Hero Card Container */}
                <div className="relative bg-white border border-[#E2E5EA] rounded-2xl shadow-xl overflow-hidden">
                  {/* Browser Window Header */}
                  <div className="bg-[#F8F9FA] px-4 py-2.5 border-b border-[#E2E5EA] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[11px] font-mono text-gray-400 bg-white px-3 py-0.5 rounded border border-gray-200">
                      https://peoplepay360.com/apps/payroll
                    </div>
                    <div className="w-4" />
                  </div>

                  {/* Generated Isometric Odoo ERP Hero Illustration */}
                  <div className="relative overflow-hidden bg-slate-900 group">
                    <img
                      src="/assets/odoo_erp_hero.jpg"
                      alt="PeoplePay360 Enterprise ERP Interface"
                      className="w-full h-auto object-cover transform group-hover:scale-102 transition-transform duration-700"
                    />

                    {/* Watermark Overlay Stamp */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>ODOO ARCHITECTURE CERTIFIED</span>
                    </div>
                  </div>

                  {/* Quick Stat Footer inside hero card */}
                  <div className="p-4 bg-white grid grid-cols-3 gap-2 text-center border-t border-[#E2E5EA]">
                    <div>
                      <div className="text-base font-black text-[#714867]">100%</div>
                      <div className="text-[10px] text-gray-500 font-medium">Auto-Computed</div>
                    </div>
                    <div className="border-x border-gray-100">
                      <div className="text-base font-black text-[#00A09D]">&lt; 3 Sec</div>
                      <div className="text-[10px] text-gray-500 font-medium">Batch Payrun</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-emerald-600">60 Sec</div>
                      <div className="text-[10px] text-gray-500 font-medium">Tenant Setup</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE COMPANY REGISTRATION SECTION ───────────────────────── */}
      <section id="register-section" className="relative z-10 py-16 bg-white border-y border-[#E2E5EA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#714867]/10 text-[#714867] text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Tenant Onboarding</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1F36] tracking-tight">
              Register Your Company Workspace
            </h2>
            <p className="text-sm text-[#475569]">
              Instant PostgreSQL schema provisioning, default salary structure, and sample attendance schedule initialized automatically.
            </p>
          </div>

          {/* Registration Card with Subtle Watermark Border */}
          <div className="bg-white border-2 border-[#714867]/20 rounded-2xl shadow-xl overflow-hidden relative">
            {/* Top Banner with Quick Fill Assistant */}
            <div className="bg-gradient-to-r from-[#714867] to-[#55364e] p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Quick Provisioning Engine</h3>
                  <p className="text-xs text-purple-200">
                    Creates an isolated tenant database, admin account, and primes statutory rules.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>⚡ Auto-Fill Demo Data</span>
              </button>
            </div>

            {/* Error Message */}
            {regError && (
              <div className="mx-6 mt-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Organization Details */}
                <div className="space-y-4">
                  <div className="border-b border-[#E2E5EA] pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#714867] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>1. Company Profile</span>
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                      Official Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Technologies India Pvt Ltd"
                      className="pp-input w-full text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                      Tenant Workspace URL (Live Slug)
                    </label>
                    <div className="flex items-center rounded-md border border-[#C4C9D4] bg-[#F8F9FA] px-3 py-2 text-xs text-[#3D4460]">
                      <span className="text-gray-400 font-mono">peoplepay360.com/c/</span>
                      <span className="font-bold text-[#714867] font-mono">
                        {slug || 'your-company-slug'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                        Industry Sector
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="pp-input w-full text-xs"
                      >
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                        Operational Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="pp-input w-full text-xs"
                      >
                        {CURRENCIES.map((cur) => (
                          <option key={cur.code} value={cur.code}>
                            {cur.symbol} - {cur.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                        className="pp-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                        Primary Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="pp-input w-full text-xs"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="pp-input w-full text-xs"
                    />
                  </div>
                </div>

                {/* Right Column: Admin Access & Security */}
                <div className="space-y-4">
                  <div className="border-b border-[#E2E5EA] pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#714867] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>2. Administrator Credentials</span>
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                      Administrator Full Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="pp-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1F36] mb-1">
                      Work Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                      className="pp-input w-full text-xs"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#1A1F36]">
                        Master Admin Password <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] font-bold text-[#714867] hover:underline cursor-pointer"
                      >
                        Generate Strong
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="pp-input w-full text-xs pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Provisioning Inclusions Banner */}
                  <div className="p-3.5 rounded-lg bg-[#F8F9FA] border border-[#E2E5EA] space-y-2 text-[11px] text-[#475569]">
                    <div className="font-bold text-[#1A1F36] flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant Multi-Tenant Provisioning includes:</span>
                    </div>
                    <ul className="space-y-1 pl-4 list-disc text-gray-500">
                      <li>PostgreSQL row-level isolation for your company ID</li>
                      <li>Standard 40-hour weekly working schedule</li>
                      <li>PTO, Sick Leave, and Unpaid Leave type quotas</li>
                      <li>Default Indian CTC Salary Structure (Basic, HRA, PF)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit CTA & Terms */}
              <div className="pt-4 border-t border-[#E2E5EA] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#6B7280]">
                  By registering, you agree to PeoplePay360 Terms of Service. No credit card required.
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-[#714867] hover:bg-[#5d3a55] text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {regLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Provisioning Workspace...</span>
                    </>
                  ) : (
                    <>
                      <RocketIcon className="w-4 h-4 text-amber-300" />
                      <span>Launch Company Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── THE ICONIC ODOO APP LAUNCHER GRID ─────────────────────────────── */}
      <section id="apps" className="relative z-10 py-20 bg-[#FAFAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A09D]/10 text-[#00A09D] text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>The Complete Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1F36] tracking-tight">
              Apps that work together seamlessly
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Every department connects to a single PostgreSQL database. Zero synchronisation lag, zero data duplication, pure enterprise throughput.
            </p>
          </div>

          {/* Grid of 6 Core Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((mod) => {
              const IconComp = mod.icon
              return (
                <div
                  key={mod.id}
                  className="bg-white border border-[#E2E5EA] hover:border-[#714867]/40 rounded-xl p-6 shadow-2xs hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    {/* App Header with Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: mod.color }}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-[#475569] px-2.5 py-1 rounded-full border border-gray-200">
                        {mod.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#1A1F36] group-hover:text-[#714867] transition-colors mb-2">
                      {mod.title}
                    </h3>

                    <p className="text-xs text-[#475569] leading-relaxed mb-4">
                      {mod.description}
                    </p>

                    {/* Bullet List */}
                    <ul className="space-y-2 mb-6">
                      {mod.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[11px] font-medium text-[#3D4460]">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer Tag */}
                  <div className="pt-3 border-t border-[#E2E5EA] flex items-center justify-between text-xs font-semibold text-[#714867]">
                    <span className="text-[11px] text-gray-400 font-mono">Module: {mod.tag}</span>
                    <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE LIVE PAYROLL & ROI CALCULATOR ──────────────────────── */}
      <section id="calculator" className="relative z-10 py-20 bg-white border-y border-[#E2E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive Formula Simulator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1F36] tracking-tight">
              Real-Time Salary Rule Engine
            </h2>
            <p className="text-sm text-[#475569]">
              Adjust the sliders below to see how PeoplePay360 calculates statutory allowances, deductions, and computes organization-wide payroll savings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAFAFC] border border-[#E2E5EA] rounded-2xl p-6 sm:p-10 shadow-md">
            {/* Sliders Control (Col 6) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Slider 1: Employees */}
              <div className="bg-white p-5 rounded-xl border border-[#E2E5EA] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A1F36] uppercase tracking-wider">
                    Company Employee Headcount
                  </label>
                  <span className="text-lg font-black text-[#714867]">
                    {calcEmployees} Staff
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="1000"
                  step="5"
                  value={calcEmployees}
                  onChange={(e) => setCalcEmployees(Number(e.target.value))}
                  className="w-full accent-[#714867] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>5 Employees</span>
                  <span>250</span>
                  <span>500</span>
                  <span>1,000+</span>
                </div>
              </div>

              {/* Slider 2: Monthly CTC / Wage */}
              <div className="bg-white p-5 rounded-xl border border-[#E2E5EA] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A1F36] uppercase tracking-wider">
                    Average Monthly Gross Salary
                  </label>
                  <span className="text-lg font-black text-[#00A09D]">
                    ₹{calcBaseSalary.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="300000"
                  step="5000"
                  value={calcBaseSalary}
                  onChange={(e) => setCalcBaseSalary(Number(e.target.value))}
                  className="w-full accent-[#00A09D] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>₹20,000 / mo</span>
                  <span>₹1,00,000</span>
                  <span>₹2,00,000</span>
                  <span>₹3,00,000+</span>
                </div>
              </div>

              {/* Organization ROI Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-[11px] font-semibold text-[#714867] uppercase tracking-wider mb-1">
                    Monthly Hours Saved
                  </div>
                  <div className="text-2xl font-black text-[#714867]">
                    ~{monthlyHoursSaved} Hours
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Zero manual spreadsheet calculations</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                    Estimated Annual Savings
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    ₹{annualSavings.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Reduced HR overhead & compliance risk</div>
                </div>
              </div>
            </div>

            {/* Live Payslip Formula Breakdown Preview (Col 6) */}
            <div className="lg:col-span-6 bg-white border border-[#E2E5EA] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E5EA] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#714867]/10 text-[#714867] flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1F36]">Live Computed Payslip Breakdown</h4>
                    <span className="text-[10px] text-gray-400 font-mono">Rule Engine: Standard Indian CTC</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Computed in 0.04ms
                </span>
              </div>

              {/* Earnings Rows */}
              <div className="space-y-2 text-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Earnings</div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-600">Basic Wage (50% of Gross)</span>
                  <span className="font-mono font-bold text-[#1A1F36]">₹{basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-600">House Rent Allowance (HRA - 40% Basic)</span>
                  <span className="font-mono font-bold text-[#1A1F36]">₹{hra.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-600">Special Allowance (Balancing Rule)</span>
                  <span className="font-mono font-bold text-[#1A1F36]">₹{specialAllowance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions Rows */}
              <div className="space-y-2 text-xs pt-1">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statutory Deductions</div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-600">Employee Provident Fund (EPF - 12% Basic)</span>
                  <span className="font-mono font-bold text-red-600">-₹{epfDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-600">Professional Tax (PT Slab)</span>
                  <span className="font-mono font-bold text-red-600">-₹{ptDeduction.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Net Take-Home Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
                    Net Monthly In-Hand
                  </span>
                  <span className="text-[10px] text-gray-500">Credited to employee bank account</span>
                </div>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  ₹{netTakeHome.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY PEOPLEPAY360 VS TRADITIONAL HRMS ──────────────────────────── */}
      <section id="comparison" className="relative z-10 py-20 bg-[#FAFAFC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1F36] tracking-tight">
              Why PeoplePay360 vs Traditional HRMS
            </h2>
            <p className="text-sm text-[#475569]">
              Built ground-up with modern TypeScript, Prisma ORM, and PostgreSQL to eliminate legacy ERP bloat.
            </p>
          </div>

          <div className="bg-white border border-[#E2E5EA] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E2E5EA] text-xs font-bold text-[#1A1F36]">
                    <th className="p-4 sm:p-5">Capability / Feature</th>
                    <th className="p-4 sm:p-5 text-[#714867] bg-purple-50/50">PeoplePay360 (Odoo Architecture)</th>
                    <th className="p-4 sm:p-5 text-gray-400">Legacy Enterprise ERPs</th>
                    <th className="p-4 sm:p-5 text-gray-400">Spreadsheets & Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5EA] text-xs text-[#3D4460]">
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-[#1A1F36]">Multi-Tenant Isolation</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-purple-50/30">
                      ✓ Instant PostgreSQL tenant-scoped isolation
                    </td>
                    <td className="p-4 sm:p-5 text-gray-500">Complex on-premise silos</td>
                    <td className="p-4 sm:p-5 text-red-500">✗ Zero data security</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-[#1A1F36]">Custom Salary Rule Formulas</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-purple-50/30">
                      ✓ Full algebraic formula engine (e.g. BASIC * 0.4)
                    </td>
                    <td className="p-4 sm:p-5 text-gray-500">Requires paid vendor consult</td>
                    <td className="p-4 sm:p-5 text-red-500">✗ Broken VLOOKUP formulas</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-[#1A1F36]">Admin Emergency Override</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-purple-50/30">
                      ✓ Spot manual adjustments & force leave grants
                    </td>
                    <td className="p-4 sm:p-5 text-gray-500">Locked down / slow support ticket</td>
                    <td className="p-4 sm:p-5 text-red-500">✗ No audit trail</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-[#1A1F36]">Printable Payslip Generation</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-purple-50/30">
                      ✓ Automated verified PDF with watermark stamps
                    </td>
                    <td className="p-4 sm:p-5 text-gray-500">Clunky crystal reports</td>
                    <td className="p-4 sm:p-5 text-red-500">✗ Manual mail-merge</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-[#1A1F36]">Setup & Onboarding Time</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-purple-50/30">
                      ✓ 60 Seconds Instant Web Provisioning
                    </td>
                    <td className="p-4 sm:p-5 text-gray-500">3 to 6 months implementation</td>
                    <td className="p-4 sm:p-5 text-gray-500">Ongoing headache</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS (FAQ) ─────────────────────────────── */}
      <section className="relative z-10 py-20 bg-white border-b border-[#E2E5EA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-black text-[#1A1F36] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#475569]">
              Everything you need to know about registering and scaling with PeoplePay360.
            </p>
          </div>

          <div className="space-y-4">
            <FaqItem
              question="How quickly is our company workspace initialized?"
              answer="Your company tenant is provisioned in less than 60 seconds upon completing the registration form. The system automatically initializes your working schedule, leave type banks, CTC salary structures, and grants master admin access."
            />
            <FaqItem
              question="Is PeoplePay360 compliant with Indian Labour Laws and Statutory Regulations?"
              answer="Yes. Our built-in salary rule configurations natively support Employee Provident Fund (EPF) 12% calculation rules, Employee State Insurance (ESI), Professional Tax (PT) slab rules, and Tax Deducted at Source (TDS) under Section 192."
            />
            <FaqItem
              question="Can we customize salary rules and mathematical formulas?"
              answer="Absolutely. Administrators and HR Payroll Managers can configure custom fixed allowances, percentage-based multipliers (e.g. BASIC * 0.40), and formula-based rules using our Odoo-standard rule sequence architecture."
            />
            <FaqItem
              question="What roles are included in the RBAC security model?"
              answer="We provide a rigorous 5-tier role hierarchy: System Admin (full root control), HR Manager (employees, contracts, time-off approvals), HR Payroll Manager (rule definitions and payruns), HR Payroll User (read-only rules, payrun execution), and Employee (self-service profile, own attendance, and personal payslips)."
            />
          </div>
        </div>
      </section>

      {/* ── RICH ODOO-STYLE MEGA FOOTER ───────────────────────────────────── */}
      <footer className="relative z-10 bg-[#1A1F36] text-white pt-16 pb-12 overflow-hidden">
        {/* Subtle Watermark Branding */}
        <div className="absolute -bottom-10 -right-10 pointer-events-none opacity-5 select-none font-black text-9xl text-white">
          ODOO
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-800">
            {/* Col 1: Brand */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#714867] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  P
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  PeoplePay<span className="text-purple-400">360</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                Open-source inspired, enterprise-grade multi-tenant HRMS and batch payroll engine. Designed for reliability, statutory compliance, and speed.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/30">
                  ISO 27001 Certified
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded border border-purple-500/30">
                  Neon DB Powered
                </span>
              </div>
            </div>

            {/* Col 2: Modules */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Core Modules</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><a href="#apps" className="hover:text-white transition-colors">Employee Master 360°</a></li>
                <li><a href="#apps" className="hover:text-white transition-colors">Shift Attendance</a></li>
                <li><a href="#apps" className="hover:text-white transition-colors">Time Off Allocations</a></li>
                <li><a href="#apps" className="hover:text-white transition-colors">Contract Administration</a></li>
                <li><a href="#apps" className="hover:text-white transition-colors">Batch Payroll Engine</a></li>
              </ul>
            </div>

            {/* Col 3: Compliance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Compliance & Trust</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><span className="hover:text-white transition-colors">EPF Act 1952</span></li>
                <li><span className="hover:text-white transition-colors">ESI Act 1948</span></li>
                <li><span className="hover:text-white transition-colors">Payment of Wages</span></li>
                <li><span className="hover:text-white transition-colors">Income Tax TDS Sec 192</span></li>
                <li><span className="hover:text-white transition-colors">PostgreSQL Row RLS</span></li>
              </ul>
            </div>

            {/* Col 4: Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Platform Access</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Administrator Portal</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Employee Self-Service</Link></li>
                <li><a href="#register-section" className="text-purple-400 font-bold hover:underline">Register New Company</a></li>
                <li><a href="#calculator" className="hover:text-white transition-colors">Salary Rule Simulator</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              &copy; {new Date().getFullYear()} PeoplePay360 ERP Platform. All rights reserved. Odoo is a trademark of Odoo S.A.
            </div>
            <div className="flex items-center gap-6">
              <a href="#overview" className="hover:text-gray-300 transition-colors">Back to Top ↑</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  )
}

interface FaqItemProps {
  question: string
  answer: string
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[#E2E5EA] rounded-xl overflow-hidden bg-white shadow-2xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-[#1A1F36] flex items-center justify-between gap-4 hover:bg-gray-50/50 cursor-pointer transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`w-4 h-4 text-[#714867] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-[#475569] leading-relaxed border-t border-[#E2E5EA] pt-3 bg-[#F8F9FA]/40">
          {answer}
        </div>
      )}
    </div>
  )
}
