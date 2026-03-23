'use client'
// components/ui.tsx
import { CSSProperties, ReactNode } from 'react'

/* ── PageHeader ─────────────────────────────────────────── */
export function PageHeader({ title, sub, actions }: { title:string; sub:string; actions?:ReactNode }) {
  return (
    <div style={{
      flexShrink:0, padding:'12px 16px',
      background:'rgba(255,255,255,0.85)',
      backdropFilter:'blur(10px)',
      borderBottom:'1.5px solid rgba(240,98,146,0.15)',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
    }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:19, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--sub)', marginTop:1, fontWeight:600 }}>{sub}</div>
      </div>
      {actions && <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>{actions}</div>}
    </div>
  )
}

/* ── Card ───────────────────────────────────────────────── */
export function Card({ children, style }: { children:ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)',
      borderRadius:'var(--radius)', border:'1.5px solid rgba(240,98,146,0.14)',
      boxShadow:'var(--shadow)', ...style,
    }}>
      {children}
    </div>
  )
}

/* ── CardHeader ─────────────────────────────────────────── */
export function CardHeader({ title, action }: { title:ReactNode; action?:ReactNode }) {
  return (
    <div style={{
      padding:'12px 14px', borderBottom:'1.5px solid rgba(240,98,146,0.10)',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
    }}>
      <span style={{ fontWeight:900, fontSize:13, color:'var(--text)' }}>{title}</span>
      {action}
    </div>
  )
}

/* ── Btn ────────────────────────────────────────────────── */
type Variant = 'primary'|'secondary'|'green'|'ghost'|'outline'|'danger'
const V: Record<Variant, CSSProperties> = {
  primary:   { background:'var(--pink)',   color:'#fff',          boxShadow:'0 3px 12px rgba(240,98,146,0.35)' },
  secondary: { background:'var(--pink-l)', color:'var(--pink-d)', boxShadow:'none' },
  green:     { background:'var(--green)',  color:'#fff',          boxShadow:'0 3px 12px rgba(102,187,106,0.35)' },
  ghost:     { background:'rgba(255,255,255,0.7)', color:'var(--sub)', boxShadow:'none', border:'1.5px solid rgba(240,98,146,0.18)' },
  outline:   { background:'rgba(255,255,255,0.8)', color:'var(--text)',boxShadow:'none', border:'1.5px solid rgba(240,98,146,0.2)' },
  danger:    { background:'#FCEBEB', color:'#A32D2D', boxShadow:'none' },
}
export function Btn({ variant='primary', children, onClick, disabled, style, fullWidth, size='md' }:
  { variant?:Variant; children:ReactNode; onClick?:()=>void; disabled?:boolean; style?:CSSProperties; fullWidth?:boolean; size?:'sm'|'md'|'lg' }) {
  const pad = size==='sm'?'6px 12px':size==='lg'?'13px 20px':'8px 15px'
  const fs  = size==='sm'?11:size==='lg'?14:12
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5,
      padding:pad, borderRadius:12, border:'none', cursor:disabled?'not-allowed':'pointer',
      fontFamily:"'Nunito',sans-serif", fontSize:fs, fontWeight:800,
      transition:'all 0.16s', width:fullWidth?'100%':undefined,
      opacity:disabled?0.55:1, ...V[variant], ...style,
    }}>
      {children}
    </button>
  )
}

/* ── Badge ──────────────────────────────────────────────── */
export function Badge({ children, bg, color }: { children:ReactNode; bg:string; color:string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800, background:bg, color, whiteSpace:'nowrap' }}>
      {children}
    </span>
  )
}

/* ── StatCard ───────────────────────────────────────────── */
export function StatCard({ icon, value, label, color }: { icon:ReactNode; value:string|number; label:string; color:string }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)',
      borderRadius:18, border:`1.5px solid ${color}22`,
      padding:'13px 14px', position:'relative', overflow:'hidden',
      boxShadow:`0 4px 18px ${color}18`,
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, borderRadius:'18px 18px 0 0' }} />
      <div style={{ marginBottom:6, color, marginTop:2 }}>{icon}</div>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:'var(--text)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--sub)', marginTop:4, fontWeight:700 }}>{label}</div>
    </div>
  )
}

/* ── ProgressBar ────────────────────────────────────────── */
export function ProgressBar({ pct, color, h=8 }: { pct:number; color:string; h?:number }) {
  return (
    <div style={{ height:h, borderRadius:h/2, background:'rgba(240,98,146,0.10)', overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:color, borderRadius:h/2, transition:'width 0.4s' }} />
    </div>
  )
}

/* ── Avatar ─────────────────────────────────────────────── */
export function Avatar({ nome, fotoUrl, color, light, size=42, radius=12 }: {
  nome:string; fotoUrl?:string|null; color:string; light:string; size?:number; radius?:number
}) {
  const ini = nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()
  return (
    <div style={{
      width:size, height:size, borderRadius:radius, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      overflow:'hidden', fontWeight:900,
      background:fotoUrl?undefined:light, color:fotoUrl?undefined:color,
      fontSize:size*0.37, border:`2px solid ${color}33`,
    }}>
      {fotoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={fotoUrl} alt={nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : ini}
    </div>
  )
}

/* ── Modal ──────────────────────────────────────────────── */
// Compacto e centralizado — NÃO ocupa a tela toda
// maxWidth 480px no desktop, 94vw no mobile
// maxHeight 85vh com scroll interno no conteúdo
export function Modal({ title, sub, children, footer, onClose }: {
  title:string; sub?:string; children:ReactNode; footer?:ReactNode; onClose:()=>void
}) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0,
        background:'rgba(74,44,58,0.50)',
        backdropFilter:'blur(4px)',
        display:'flex',
        alignItems:'center',       /* centralizado verticalmente */
        justifyContent:'center',
        zIndex:200,
        padding:'16px',            /* margem ao redor em qualquer tela */
      }}
    >
      <div
        className="animate-pop"
        style={{
          background:'rgba(255,255,255,0.98)',
          borderRadius:22,
          width:'100%',
          maxWidth:460,             /* nunca mais largo que 460px */
          maxHeight:'85vh',         /* nunca mais alto que 85% da tela */
          display:'flex',
          flexDirection:'column',
          overflow:'hidden',
          boxShadow:'0 20px 60px rgba(240,98,146,0.25)',
          border:'1.5px solid rgba(240,98,146,0.15)',
        }}
      >
        {/* Cabeçalho fixo */}
        <div style={{ padding:'16px 20px', borderBottom:'1.5px solid rgba(240,98,146,0.10)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'var(--text)' }}>{title}</div>
            {sub && <div style={{ fontSize:11, color:'var(--sub)', marginTop:2, fontWeight:600 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, background:'var(--pink-l)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--pink-d)', fontSize:15, fontWeight:900, flexShrink:0 }}>✕</button>
        </div>

        {/* Conteúdo com scroll */}
        <div style={{
          padding:'16px 20px',
          flex:1,
          overflowY:'auto',
          display:'flex', flexDirection:'column', gap:14,
          /* Scroll suave no iOS */
          WebkitOverflowScrolling:'touch',
        } as CSSProperties}>
          {children}
        </div>

        {/* Rodapé fixo */}
        {footer && (
          <div style={{ padding:'12px 20px', borderTop:'1.5px solid rgba(240,98,146,0.10)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0, background:'rgba(255,255,255,0.98)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Field + Input + Select + Textarea ──────────────────── */
export function Field({ label, required, children }: { label:string; required?:boolean; children:ReactNode }) {
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:900, color:'var(--text)', display:'block', marginBottom:5 }}>
        {label} {required && <span style={{ color:'var(--pink)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputBase: CSSProperties = {
  width:'100%', padding:'11px 13px',
  border:'1.5px solid rgba(240,98,146,0.22)',
  borderRadius:12, fontFamily:"'Nunito',sans-serif",
  /* 16px impede zoom automático no iOS */
  fontSize:16, fontWeight:600, color:'var(--text)',
  background:'rgba(255,255,255,0.90)', outline:'none',
}
export const Input    = (p: React.InputHTMLAttributes<HTMLInputElement>)       => <input    {...p} style={{ ...inputBase, ...p.style }} />
export const Select   = (p: React.SelectHTMLAttributes<HTMLSelectElement>)     => <select   {...p} style={{ ...inputBase, ...p.style }} />
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} style={{ ...inputBase, resize:'none', ...p.style }} />

/* ── Empty + Loading ────────────────────────────────────── */
export function Empty({ msg }: { msg:string }) {
  return <div style={{ padding:'36px 20px', textAlign:'center', color:'var(--sub)', fontSize:13, fontWeight:800 }}>{msg}</div>
}

export function Loading() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, padding:40, flexDirection:'column', gap:14 }}>
      <div style={{ width:38, height:38, borderRadius:'50%', border:'3.5px solid var(--pink-m)', borderTopColor:'var(--pink)', animation:'spin 0.7s linear infinite' }} />
      <div style={{ fontSize:12, fontWeight:700, color:'var(--sub)' }}>Carregando...</div>
    </div>
  )
}