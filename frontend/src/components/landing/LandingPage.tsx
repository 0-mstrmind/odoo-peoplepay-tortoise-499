import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useIsAuthed } from '@/store/auth.store'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const isAuthed = useIsAuthed()

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFC] text-[#1A1F36] font-sans antialiased selection:bg-[#714867] selection:text-white relative overflow-x-hidden">
      {/* ── WATERMARK BACKGROUND OVERLAY ──────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-repeat bg-top"
        style={{
          backgroundImage: "url('/assets/odoo_watermark_pattern.jpg')",
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

      <div className="relative z-10">
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
                  <Link
                    to="/register"
                    className="px-4 py-2 text-xs font-bold bg-[#714867] hover:bg-[#5d3a55] text-white rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── HERO SECTION WITH WATERMARK GRAPHICS ─────────────────────────── */}
        <section id="overview" className="relative z-10 pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
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
                  {isAuthed ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold bg-[#714867] hover:bg-[#5d3a55] text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <span>Enter Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold bg-[#714867] hover:bg-[#5d3a55] text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <Building2 className="w-4 h-4 text-amber-300" />
                        <span>Get Started / Register</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        to="/login"
                        className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold bg-white hover:bg-gray-50 text-[#3D4460] border border-[#E2E5EA] rounded-lg transition-all shadow-2xs hover:border-[#714867] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Sign In to Portal</span>
                      </Link>
                    </>
                  )}
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
      </div>

      {/* ── MINIMAL CLEAN FOOTER ─────────────────────────────────────────── */}
      <footer className="relative z-10 py-6 text-center text-xs text-gray-500 border-t border-[#E2E5EA] bg-white/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} PeoplePay360 ERP Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <span>Multi-Tenant SaaS</span>
            <span>•</span>
            <span>PostgreSQL & Prisma</span>
            <span>•</span>
            <Link to="/login" className="hover:text-[#714867] transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
