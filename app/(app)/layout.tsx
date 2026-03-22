'use client'
// app/(app)/layout.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon, UserGroupIcon, BookOpenIcon,
  ClipboardDocumentListIcon, ChartBarIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline'

const NAV = [
  { href:'/dashboard',     label:'Dashboard',    Icon:HomeIcon,                  section:'menu'    },
  { href:'/criancas',      label:'Crianças',      Icon:UserGroupIcon,             section:'menu'    },
  { href:'/chamada-turma', label:'Por Turma',     Icon:BookOpenIcon,              section:'chamada' },
  { href:'/chamada-geral', label:'Chamada Geral', Icon:ClipboardDocumentListIcon, section:'chamada' },
  { href:'/relatorios',    label:'Relatórios',    Icon:ChartBarIcon,              section:'extra'   },
]

function SidebarClouds() {
  return (
    <svg viewBox="0 0 228 700" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
      <path d="M 55 79 Q 13 79 13 55 Q 13 32 35 30 Q 35 8 58 5 Q 62 -8 82 -8 Q 104 -8 108 10 Q 126 2 142 12 Q 162 10 169 30 Q 184 32 184 50 Q 184 72 162 72 Z" fill="white" opacity="0.14"/>
      <path d="M 110 22 Q 122 16 130 22" fill="none" stroke="white" opacity="0.18" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 175 155 Q 147 155 147 137 Q 147 119 162 117 Q 162 100 178 98 Q 180 88 192 88 Q 205 88 207 98 Q 217 93 225 100 Q 235 98 238 110 Q 245 112 245 123 Q 245 138 231 138 Z" fill="white" opacity="0.11"/>
      <path d="M 60 285 Q 22 285 22 260 Q 22 237 44 234 Q 44 211 67 208 Q 71 195 91 195 Q 113 195 117 213 Q 135 205 151 215 Q 171 212 178 233 Q 193 235 193 253 Q 193 275 171 275 Z" fill="white" opacity="0.10"/>
      <path d="M 168 465 Q 122 465 122 438 Q 122 412 148 410 Q 148 385 175 382 Q 179 367 202 367 Q 228 367 232 386 Q 253 377 271 389 Q 295 386 303 409 Q 321 411 321 432 Q 321 458 294 458 Z" fill="white" opacity="0.12"/>
      <path d="M 233 398 Q 248 391 258 398" fill="none" stroke="white" opacity="0.16" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 45 590 Q 9 590 9 569 Q 9 549 28 547 Q 28 527 49 524 Q 52 512 65 512 Q 79 512 82 524 Q 95 518 106 526 Q 121 524 126 540 Q 135 542 135 556 Q 135 574 118 574 Z" fill="white" opacity="0.10"/>
    </svg>
  )
}

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname()

  return (
    <nav style={{ flex:1, padding:'4px 10px', display:'flex', flexDirection:'column', gap:2 }}>
      {NAV.map(({ href, label, Icon, section }, idx) => {
        const active = path === href || path.startsWith(href + '/')
        const prevSection = idx > 0 ? NAV[idx - 1].section : null
        const isFirstOfSection = prevSection !== section

        return (
          <div key={href}>
            {/* Divisor entre seções */}
            {isFirstOfSection && idx > 0 && (
              <div style={{ margin:'8px 6px 4px', height:1, background:'rgba(255,255,255,0.20)' }} />
            )}
            {/* Label "Chamada" só antes do primeiro item da seção chamada */}
            {section === 'chamada' && isFirstOfSection && (
              <div style={{ padding:'2px 12px 5px', fontSize:9, fontWeight:900, letterSpacing:'1.4px', color:'rgba(255,255,255,0.48)', textTransform:'uppercase' }}>
                Chamada
              </div>
            )}
            <Link href={href} onClick={onNavigate} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 13px', borderRadius:14, textDecoration:'none',
              fontSize:13, fontWeight:700,
              color: active ? '#fff' : 'rgba(255,255,255,0.80)',
              background: active ? 'rgba(255,255,255,0.22)' : 'transparent',
              boxShadow: active ? 'inset 0 0 0 1.5px rgba(255,255,255,0.20), 0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition:'all 0.15s',
            }}>
              <Icon style={{ width:18, height:18, strokeWidth: active ? 2.5 : 2, flexShrink:0 }} />
              {label}
            </Link>
          </div>
        )
      })}
    </nav>
  )
}

const SIDEBAR_BG = '#F06292'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const SidebarInner = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', position:'relative', overflow:'hidden' }}>
      <SidebarClouds />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%' }}>

        {/* ── Logo ── */}
        <div style={{ padding:'18px 18px 10px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:48, height:48, borderRadius:50, flexShrink:0, overflow:'hidden',
            background:'rgba(255,255,255,0.15)',
            border:'2px solid rgba(255,255,255,0.30)',
            boxShadow:'0 2px 12px rgba(0,0,0,0.18)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-infancia.png"
              alt="Logo Infância"
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              onError={e => { (e.currentTarget.parentElement!).style.background='rgba(255,255,255,0.25)' }}
            />
          </div>
          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'#fff', lineHeight:1.1 }}>Infância</div>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.65)', marginTop:1 }}>Ministério Infantil · 2026</div>
          </div>
        </div>

        <SidebarLinks onNavigate={onNavigate} />

        <div style={{ padding:'12px 14px 18px' }}>
          <div style={{ background:'rgba(255,255,255,0.16)', borderRadius:12, padding:'9px 13px', fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.90)', textAlign:'center', border:'1px solid rgba(255,255,255,0.14)' }}>
            🗓 1º semestre / 2026
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <aside className="sidebar-desktop" style={{ width:228, flexShrink:0, background:SIDEBAR_BG, boxShadow:'3px 0 22px rgba(240,98,146,0.22)' }}>
        <SidebarInner />
      </aside>

      {open && <>
        <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(74,44,58,0.45)', zIndex:40 }} />
        <aside style={{ position:'fixed', left:0, top:0, bottom:0, width:240, zIndex:50, background:SIDEBAR_BG, boxShadow:'4px 0 24px rgba(240,98,146,0.30)' }}>
          <button onClick={()=>setOpen(false)} style={{ position:'absolute', top:14, right:14, width:32, height:32, borderRadius:9, border:'none', background:'rgba(255,255,255,0.22)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
            <XMarkIcon style={{ width:16, height:16 }} />
          </button>
          <SidebarInner onNavigate={()=>setOpen(false)} />
        </aside>
      </>}

      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minWidth:0 }}>
        <div className="topbar-mobile" style={{ display:'none', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)', borderBottom:'1.5px solid var(--border)', flexShrink:0 }}>
          <button onClick={()=>setOpen(true)} style={{ width:36, height:36, borderRadius:11, border:'none', background:'var(--pink-l)', color:'var(--pink-d)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bars3Icon style={{ width:18, height:18 }} />
          </button>
          <div style={{ width:30, height:30, borderRadius:50, overflow:'hidden', border:'1.5px solid var(--pink-m)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-infancia.png" alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'var(--text)' }}>Infância</div>
        </div>
        <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .topbar-mobile   { display: flex !important; }
        }
      `}</style>
    </div>
  )
}