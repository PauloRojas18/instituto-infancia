'use client'
// app/(app)/chamada-turma/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER, Turma } from '@/types'
import { PageHeader, Card, Avatar, Btn, ProgressBar, Loading } from '@/components/ui'
import { CheckIcon, ArrowLeftIcon, CheckCircleIcon, CalendarDaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { formatDateLong, getToday } from '@/lib/utils'
import { useIsMobile } from '@/lib/useIsMobile'

type View = 'lista' | 'chamada'
interface ChamadaAPI { data: string; turma: string }
const TURMA_EMOJI: Record<string, string> = { maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀' }

const TURMA_BG: Record<string, string> = {
  maternal: '#FFF0F5',
  jardim:   '#F0FFF4',
  nivel2a:  '#F0F8FF',
  nivel2b:  '#F8F0FF',
}

export default function ChamadaTurmaPage() {
  const hoje     = getToday()
  const isMobile = useIsMobile()

  const [criancas,        setCriancas]        = useState<Crianca[]>([])
  const [loading,         setLoading]         = useState(true)
  const [view,            setView]            = useState<View>('lista')
  const [turmaAtiva,      setTurmaAtiva]      = useState<Turma | null>(null)
  const [presencas,       setPresencas]       = useState<Record<number, boolean>>({})
  const [salvando,        setSalvando]        = useState(false)
  const [salvou,          setSalvou]          = useState(false)
  const [feitasHoje,      setFeitasHoje]      = useState<Record<string, boolean>>({})

  // ── NOVO: estado da data selecionada ────────────────────
  const [dataSelecionada, setDataSelecionada] = useState<string>(hoje)
  const ehHoje       = dataSelecionada === hoje
  const ehRetroativa = dataSelecionada < hoje

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

  // Recalcula "feitas" quando a data muda
  // (idealmente você faria um fetch filtrado por data, mas aqui o estado local é suficiente
  //  se a API de chamadas já retornar todas as datas)
  const [todasChamadas, setTodasChamadas] = useState<ChamadaAPI[]>([])

  useEffect(() => {
    fetch('/api/chamadas')
      .then(r => r.json())
      .then((ch: ChamadaAPI[]) => {
        if (!Array.isArray(ch)) return
        setTodasChamadas(ch)
      })
  }, [])

  // Recomputa quais turmas já têm chamada na data selecionada
  useEffect(() => {
    const feitas: Record<string, boolean> = {}
    todasChamadas.forEach(x => { if (x.data === dataSelecionada) feitas[x.turma] = true })
    setFeitasHoje(feitas)
  }, [dataSelecionada, todasChamadas])

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
      // usa dataSelecionada em vez de hoje
      body: JSON.stringify({ turma:turmaAtiva, data:dataSelecionada, presencas: membros.map(c=>({criancaId:c.id, presente:presencas[c.id]??false})) })
    })
    setSalvando(false); setSalvou(true)
    setFeitasHoje(prev => ({ ...prev, [turmaAtiva]: true }))
    // atualiza cache local de todas as chamadas
    setTodasChamadas(prev => [...prev.filter(x => !(x.data === dataSelecionada && x.turma === turmaAtiva)), { data: dataSelecionada, turma: turmaAtiva }])
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
        <PageHeader title={t.label} sub={formatDateLong(dataSelecionada)}
          actions={<Btn variant="ghost" size="sm" onClick={()=>setView('lista')}><ArrowLeftIcon style={{ width:14,height:14 }} /> Voltar</Btn>}
        />
        <div style={{ flex:1, overflowY:'auto', padding:pad } as React.CSSProperties} className="animate-up">
          <div style={{ maxWidth: isMobile ? '100%' : 560, margin:'0 auto' }}>

            {/* Aviso retroativa na tela de chamada */}
            {ehRetroativa && (
              <div style={{ background:'rgba(255,152,0,0.12)', border:'1.5px solid rgba(255,152,0,0.35)', borderRadius:14, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <ExclamationTriangleIcon style={{ width:16, height:16, color:'#e65100', flexShrink:0 }} />
                <span style={{ fontSize:12, fontWeight:800, color:'#e65100' }}>
                  Chamada retroativa · {formatDateLong(dataSelecionada)}
                </span>
              </div>
            )}

            {/* Header com % */}
            <div style={{ borderRadius:20, padding:'16px 18px', marginBottom:12, background:`linear-gradient(135deg,${t.color},${t.color}BB)`, color:'white', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:`0 4px 16px ${t.color}44` }}>
              <div>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: isMobile ? 18 : 19 }}>{t.label}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.78)', fontWeight:700, marginTop:2 }}>{formatDateLong(dataSelecionada)}</div>
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
      <PageHeader title="Chamada por Turma" sub={formatDateLong(dataSelecionada)} />
      <div style={{ flex:1, overflowY:'auto', padding:pad } as React.CSSProperties} className="animate-up">

        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,var(--pink) 0%,var(--purple) 100%)', borderRadius:20, padding: isMobile ? '14px 16px' : '18px 22px', marginBottom: isMobile ? 12 : 14, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 18px rgba(240,98,146,0.28)' }}>
          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: isMobile ? 16 : 19, color:'white' }}>
              {formatDateLong(dataSelecionada)}
              {ehHoje && <span style={{ fontSize:11, background:'rgba(255,255,255,0.25)', borderRadius:20, padding:'3px 8px', marginLeft:8, fontFamily:"'Nunito',sans-serif", fontWeight:900 }}>hoje</span>}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginTop:2, fontWeight:700 }}>Selecione uma turma para registrar a chamada</div>
          </div>
          <div style={{ width:44,height:44,borderRadius:14,background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',flexShrink:0 }}>
            <CalendarDaysIcon style={{ width:22,height:22 }} />
          </div>
        </div>

        {/* ── SELETOR DE DATA ────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.92)',
          border: ehRetroativa
            ? '1.5px solid rgba(255,152,0,0.45)'
            : '1.5px solid rgba(240,98,146,0.2)',
          borderRadius: 14,
          padding: '10px 14px',
          marginBottom: isMobile ? 14 : 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <CalendarDaysIcon style={{ width:18, height:18, color: ehRetroativa ? '#e65100' : '#f06292', flexShrink:0 }} />

          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:900, color:'var(--sub)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:2 }}>
              Data da chamada
            </div>
            <input
              type="date"
              max={hoje}
              value={dataSelecionada}
              onChange={e => setDataSelecionada(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontFamily: "'Nunito', sans-serif",
                fontSize: 14,
                fontWeight: 800,
                color: ehRetroativa ? '#e65100' : 'var(--text)',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          </div>

          {/* Pílula de status */}
          <span style={{
            background: ehHoje
              ? 'rgba(240,98,146,0.12)'
              : 'rgba(255,152,0,0.12)',
            color: ehHoje ? '#c2185b' : '#e65100',
            fontSize: 11,
            fontWeight: 900,
            padding: '4px 10px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {ehHoje ? 'hoje' : 'retroativa'}
          </span>

          {/* Botão voltar para hoje — só aparece quando não é hoje */}
          {!ehHoje && (
            <button
              type="button"
              onClick={() => setDataSelecionada(hoje)}
              style={{
                background: 'var(--pink)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Hoje
            </button>
          )}
        </div>

        {/* Aviso retroativa */}
        {ehRetroativa && (
          <div style={{
            background: 'rgba(255,152,0,0.1)',
            border: '1.5px solid rgba(255,152,0,0.3)',
            borderRadius: 12,
            padding: '9px 14px',
            marginBottom: isMobile ? 14 : 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <ExclamationTriangleIcon style={{ width:15, height:15, color:'#e65100', flexShrink:0 }} />
            <span style={{ fontSize:12, fontWeight:800, color:'#e65100' }}>
              Você está registrando uma chamada retroativa para {formatDateLong(dataSelecionada)}
            </span>
          </div>
        )}

        {/* Cards de turma */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 14 : 14 }}>
          {TURMAS_ORDER.map(tid => {
            const t       = TURMA_CONFIG[tid]
            const membros = criancas.filter(c => c.turma === tid)
            const feita   = feitasHoje[tid]

            return (
              <Card key={tid} style={{
                overflow:'hidden',
                border:`2px solid ${t.color}`,
                boxShadow: isMobile ? `0 4px 16px ${t.color}30` : `0 4px 18px ${t.color}20`,
                background: isMobile ? TURMA_BG[tid] : 'rgba(255,255,255,0.88)',
              }}>

                <div style={{
                  padding: isMobile ? '14px 16px' : '14px 16px',
                  background: t.color,
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
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
                      <CheckIcon style={{ width:11,height:11,strokeWidth:3 }} /> {ehHoje ? 'feita hoje' : 'já registrada'}
                    </span>
                  )}
                </div>

                <div style={{ padding:'12px 14px' }}>
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