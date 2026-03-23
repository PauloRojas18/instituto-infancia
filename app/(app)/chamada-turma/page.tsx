'use client'
// app/(app)/chamada-turma/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER, Turma } from '@/types'
import { PageHeader, Card, Avatar, Btn, ProgressBar, Loading } from '@/components/ui'
import { CheckIcon, ArrowLeftIcon, CheckCircleIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { formatDateLong, getToday } from '@/lib/utils'
import { useIsMobile } from '@/lib/useIsMobile'

type View = 'lista' | 'chamada'
interface ChamadaAPI { data: string; turma: string }
const TURMA_EMOJI: Record<string, string> = { maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀' }

// Cor de fundo levemente diferente por turma para separação visual
const TURMA_BG: Record<string, string> = {
  maternal: '#FFF0F5',
  jardim:   '#F0FFF4',
  nivel2a:  '#F0F8FF',
  nivel2b:  '#F8F0FF',
}

export default function ChamadaTurmaPage() {
  const hoje     = getToday()
  const isMobile = useIsMobile()

  const [criancas,   setCriancas]   = useState<Crianca[]>([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState<View>('lista')
  const [turmaAtiva, setTurmaAtiva] = useState<Turma | null>(null)
  const [presencas,  setPresencas]  = useState<Record<number, boolean>>({})
  const [salvando,   setSalvando]   = useState(false)
  const [salvou,     setSalvou]     = useState(false)
  const [feitasHoje, setFeitasHoje] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/criancas').then(r => r.json()),
      fetch('/api/chamadas').then(r => r.json()),
    ]).then(([c, ch]: [Crianca[], ChamadaAPI[]]) => {
      if (cancelled) return
      setCriancas(Array.isArray(c) ? c : [])
      const feitas: Record<string, boolean> = {}
      if (Array.isArray(ch)) ch.forEach(x => { if (x.data === hoje) feitas[x.turma] = true })
      setFeitasHoje(feitas); setLoading(false)
    })
    return () => { cancelled = true }
  }, [hoje])

  const iniciar = (turma: Turma) => {
    const init: Record<number, boolean> = {}
    criancas.filter(c => c.turma === turma).forEach(c => { init[c.id] = false })
    setPresencas(init); setTurmaAtiva(turma); setSalvou(false); setView('chamada')
  }

  const toggle = useCallback((id: number) => {
    setPresencas(p => ({ ...p, [id]: !p[id] }))
  }, [])

  const marcarTodos = useCallback((val: boolean) => {
    setPresencas(prev => { const n={...prev}; Object.keys(n).forEach(k=>{n[Number(k)]=val}); return n })
  }, [])

  const salvar = async () => {
    if (!turmaAtiva) return
    setSalvando(true)
    const membros = criancas.filter(c => c.turma === turmaAtiva)
    await fetch('/api/chamadas', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ turma:turmaAtiva, data:hoje, presencas: membros.map(c=>({criancaId:c.id, presente:presencas[c.id]??false})) })
    })
    setSalvando(false); setSalvou(true)
    setFeitasHoje(prev => ({ ...prev, [turmaAtiva]: true }))
    setTimeout(() => { setView('lista'); setTurmaAtiva(null) }, 1500)
  }

  if (loading) return <><PageHeader title="Chamada por Turma" sub="Registro de presença" /><Loading /></>

  const pad = isMobile ? '14px 14px' : '16px 24px'

  // ── TELA DE CHAMADA ──────────────────────────────────────
  if (view === 'chamada' && turmaAtiva) {
    const t       = TURMA_CONFIG[turmaAtiva]
    const membros = criancas.filter(c => c.turma === turmaAtiva)
    const pres    = membros.filter(c => presencas[c.id]).length
    const total   = membros.length
    const pct     = total > 0 ? Math.round(pres / total * 100) : 0

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
        <PageHeader title={t.label} sub={formatDateLong(hoje)}
          actions={<Btn variant="ghost" size="sm" onClick={()=>setView('lista')}><ArrowLeftIcon style={{ width:14,height:14 }} /> Voltar</Btn>}
        />
        <div style={{ flex:1, overflowY:'auto', padding:pad } as React.CSSProperties} className="animate-up">
          <div style={{ maxWidth: isMobile ? '100%' : 560, margin:'0 auto' }}>

            {/* Header com % */}
            <div style={{ borderRadius:20, padding:'16px 18px', marginBottom:12, background:`linear-gradient(135deg,${t.color},${t.color}BB)`, color:'white', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:`0 4px 16px ${t.color}44` }}>
              <div>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: isMobile ? 18 : 19 }}>{t.label}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.78)', fontWeight:700, marginTop:2 }}>{formatDateLong(hoje)}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: isMobile ? 30 : 32 }}>{pct}%</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.78)' }}>{pres}/{total}</div>
              </div>
            </div>

            <ProgressBar pct={pct} color={t.color} h={8} />

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'12px 0 10px' }}>
              <span style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--sub)' }}>Crianças ({total})</span>
              <div style={{ display:'flex', gap:6 }}>
                <Btn variant="secondary" size="sm" onClick={()=>marcarTodos(true)}><CheckIcon style={{ width:12,height:12 }} /> Todos</Btn>
                <Btn variant="ghost" size="sm" onClick={()=>marcarTodos(false)}>Limpar</Btn>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {membros.map(c => {
                const presente = presencas[c.id] ?? false
                return (
                  <button key={c.id} type="button" onClick={()=>toggle(c.id)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'13px 14px', borderRadius:16, cursor:'pointer', width:'100%',
                    fontFamily:"'Nunito',sans-serif", transition:'all 0.12s', textAlign:'left',
                    border: presente ? `2px solid ${t.color}` : '1.5px solid rgba(240,98,146,0.15)',
                    background: presente ? t.light : 'rgba(255,255,255,0.88)',
                    minHeight: isMobile ? 64 : 56,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <Avatar nome={c.nome} color={t.color} light={t.light} size={44} radius={13} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color: presente ? t.text : 'var(--text)' }}>{c.nome}</div>
                        <div style={{ fontSize:11, color: presente ? t.text : 'var(--sub)', fontWeight:700, marginTop:2 }}>
                          {presente ? 'Presente ✓' : 'Toque para marcar'}
                        </div>
                      </div>
                    </div>
                    <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, border:`2px solid ${presente ? t.color : '#CBD5E1'}`, background: presente ? t.color : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {presente && <CheckIcon style={{ width:15,height:15,color:'white',strokeWidth:3 }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            {salvou ? (
              <div style={{ background:'var(--green-l)', color:'var(--green-d)', borderRadius:16, padding:16, textAlign:'center', fontWeight:900, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <CheckCircleIcon style={{ width:20,height:20 }} /> Chamada salva com sucesso!
              </div>
            ) : (
              <button type="button" onClick={salvar} disabled={salvando} style={{
                width:'100%', padding:16, borderRadius:16, border:'none',
                cursor:salvando?'not-allowed':'pointer',
                fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:900, color:'white',
                background:`linear-gradient(135deg,${t.color},${t.color}BB)`,
                opacity:salvando?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:`0 4px 16px ${t.color}44`, minHeight:52,
              }}>
                <CheckIcon style={{ width:18,height:18 }} />
                {salvando ? 'Salvando...' : `Salvar chamada · ${pres} presente${pres!==1?'s':''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── LISTA DE TURMAS ──────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader title="Chamada por Turma" sub={formatDateLong(hoje)} />
      <div style={{ flex:1, overflowY:'auto', padding:pad } as React.CSSProperties} className="animate-up">

        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,var(--pink) 0%,var(--purple) 100%)', borderRadius:20, padding: isMobile ? '14px 16px' : '18px 22px', marginBottom: isMobile ? 16 : 18, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 18px rgba(240,98,146,0.28)' }}>
          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: isMobile ? 16 : 19, color:'white' }}>{formatDateLong(hoje)}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginTop:2, fontWeight:700 }}>Selecione uma turma para registrar a chamada</div>
          </div>
          <div style={{ width:44,height:44,borderRadius:14,background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',flexShrink:0 }}>
            <CalendarDaysIcon style={{ width:22,height:22 }} />
          </div>
        </div>

        {/* Cards de turma */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 14 }}>
          {TURMAS_ORDER.map(tid => {
            const t       = TURMA_CONFIG[tid]
            const membros = criancas.filter(c => c.turma === tid)
            const feita   = feitasHoje[tid]

            return (
              <Card key={tid} style={{
                overflow:'hidden',
                /* Borda colorida bem visível na cor da turma */
                border:`2px solid ${t.color}`,
                /* Sombra colorida para separar bem os cards */
                boxShadow: isMobile ? `0 4px 16px ${t.color}30` : `0 4px 18px ${t.color}20`,
                /* Fundo levemente tintado da cor da turma */
                background: isMobile ? TURMA_BG[tid] : 'rgba(255,255,255,0.88)',
              }}>

                {/* Cabeçalho colorido — mais alto no mobile para ser fácil de identificar */}
                <div style={{
                  padding: isMobile ? '14px 16px' : '14px 16px',
                  background: t.color,
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {/* Emoji grande para identificação rápida */}
                    <span style={{ fontSize: isMobile ? 28 : 22, lineHeight:1 }}>{TURMA_EMOJI[tid]}</span>
                    <div>
                      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: isMobile ? 18 : 16, color:'white', lineHeight:1.2 }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.85)', marginTop:2, fontWeight:700 }}>
                        {t.faixa} · {membros.length} criança{membros.length!==1?'s':''}
                      </div>
                    </div>
                  </div>
                  {feita && (
                    <span style={{ background:'rgba(255,255,255,0.28)', color:'white', fontSize:10, fontWeight:900, padding:'5px 12px', borderRadius:20, display:'flex', alignItems:'center', gap:4, flexShrink:0, whiteSpace:'nowrap' }}>
                      <CheckIcon style={{ width:11,height:11,strokeWidth:3 }} /> feita hoje
                    </span>
                  )}
                </div>

                {/* Corpo do card */}
                <div style={{ padding:'12px 14px' }}>
                  {/* Pílulas com primeiros nomes */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12, minHeight:28 }}>
                    {membros.slice(0,isMobile?5:6).map(m => (
                      <span key={m.id} style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800, background:t.light, color:t.text }}>
                        {m.nome.split(' ')[0]}
                      </span>
                    ))}
                    {membros.length>(isMobile?5:6) && (
                      <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800, background:`${t.color}18`, color:t.text }}>
                        +{membros.length-(isMobile?5:6)} mais
                      </span>
                    )}
                    {membros.length===0 && (
                      <span style={{ fontSize:12, color:'var(--sub)', fontWeight:700 }}>Nenhuma criança cadastrada</span>
                    )}
                  </div>

                  {/* Botão de chamada — bem destacado */}
                  <button type="button" onClick={()=>iniciar(tid)} style={{
                    width:'100%',
                    padding: isMobile ? '14px' : '10px',
                    borderRadius:12,
                    cursor:'pointer',
                    background: feita ? 'rgba(255,255,255,0.6)' : t.color,
                    color: feita ? t.text : 'white',
                    border: feita ? `1.5px solid ${t.color}` : 'none',
                    fontFamily:"'Nunito',sans-serif",
                    fontSize: isMobile ? 14 : 13,
                    fontWeight:900,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                    boxShadow: feita ? 'none' : `0 3px 12px ${t.color}44`,
                    minHeight: isMobile ? 50 : 40,
                    transition:'all 0.15s',
                  } as React.CSSProperties}>
                    <CheckIcon style={{ width:15,height:15 }} />
                    {feita ? '✏️ Refazer chamada' : '📋 Fazer chamada'}
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}