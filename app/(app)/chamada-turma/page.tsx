'use client'
// app/(app)/chamada-turma/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER, Turma } from '@/types'
import { PageHeader, Card, Avatar, Btn, ProgressBar, Loading } from '@/components/ui'
import {
  CheckIcon, ArrowLeftIcon, CheckCircleIcon, CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { formatDateLong, getToday } from '@/lib/utils'

type View = 'lista' | 'chamada'

interface ChamadaAPI { data: string; turma: string }

const TURMA_EMOJI: Record<string, string> = {
  maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀',
}

export default function ChamadaTurmaPage() {
  const hoje = getToday()  // estável — não muda durante a sessão

  const [criancas,   setCriancas]   = useState<Crianca[]>([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState<View>('lista')
  const [turmaAtiva, setTurmaAtiva] = useState<Turma | null>(null)
  const [presencas,  setPresencas]  = useState<Record<number, boolean>>({})
  const [salvando,   setSalvando]   = useState(false)
  const [salvou,     setSalvou]     = useState(false)
  const [feitasHoje, setFeitasHoje] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/criancas').then(r => r.json()),
      fetch('/api/chamadas').then(r  => r.json()),
    ]).then(([c, ch]: [Crianca[], ChamadaAPI[]]) => {
      if (cancelled) return
      setCriancas(Array.isArray(c) ? c : [])
      const feitas = new Set<string>()
      if (Array.isArray(ch)) ch.forEach(x => { if (x.data === hoje) feitas.add(x.turma) })
      setFeitasHoje(feitas)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [hoje])  // hoje é estável, satisfaz o linter sem loop

  const iniciar = (turma: Turma) => {
    const membros = criancas.filter(c => c.turma === turma)
    const init: Record<number, boolean> = {}
    membros.forEach(c => { init[c.id] = false })
    setPresencas(init)
    setTurmaAtiva(turma)
    setSalvou(false)
    setView('chamada')
  }

  const toggle = useCallback((id: number) => {
    setPresencas(p => ({ ...p, [id]: !p[id] }))
  }, [])

  const marcarTodos = useCallback((val: boolean) => {
    setPresencas(prev => {
      const novo = { ...prev }
      Object.keys(novo).forEach(k => { novo[Number(k)] = val })
      return novo
    })
  }, [])

  const salvar = async () => {
    if (!turmaAtiva) return
    setSalvando(true)
    const membros = criancas.filter(c => c.turma === turmaAtiva)
    await fetch('/api/chamadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turma: turmaAtiva,
        data:  hoje,
        presencas: membros.map(c => ({ criancaId: c.id, presente: presencas[c.id] ?? false })),
      }),
    })
    setSalvando(false)
    setSalvou(true)
    setFeitasHoje(prev => new Set([...prev, turmaAtiva]))
    setTimeout(() => { setView('lista'); setTurmaAtiva(null) }, 1500)
  }

  if (loading) return <><PageHeader title="Chamada por Turma" sub="Registro de presença" /><Loading /></>

  // ── TELA DE CHAMADA ──────────────────────────────────────────
  if (view === 'chamada' && turmaAtiva) {
    const t       = TURMA_CONFIG[turmaAtiva]
    const membros = criancas.filter(c => c.turma === turmaAtiva)
    const pres    = membros.filter(c => presencas[c.id]).length
    const total   = membros.length
    const pct     = total > 0 ? Math.round(pres / total * 100) : 0

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
        <PageHeader title={t.label} sub={formatDateLong(hoje)}
          actions={
            <Btn variant="ghost" size="sm" onClick={()=>setView('lista')}>
              <ArrowLeftIcon style={{ width:14, height:14 }} /> Voltar
            </Btn>
          }
        />
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }} className="animate-up">
          <div style={{ maxWidth:560, margin:'0 auto' }}>

            <div style={{
              borderRadius:22, padding:'18px 22px', marginBottom:14,
              background:`linear-gradient(135deg, ${t.color}, ${t.color}BB)`,
              color:'white', display:'flex', alignItems:'center', justifyContent:'space-between',
              boxShadow:`0 6px 22px ${t.color}44`,
            }}>
              <div>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:19 }}>{t.label}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.78)', fontWeight:700, marginTop:2 }}>
                  {formatDateLong(hoje)}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:32 }}>{pct}%</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.78)' }}>{pres}/{total}</div>
              </div>
            </div>

            <ProgressBar pct={pct} color={t.color} h={10} />

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'14px 0 12px' }}>
              <span style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--sub)' }}>
                Crianças ({total})
              </span>
              <div style={{ display:'flex', gap:6 }}>
                <Btn variant="secondary" size="sm" onClick={()=>marcarTodos(true)}>
                  <CheckIcon style={{ width:12, height:12 }} /> Todos
                </Btn>
                <Btn variant="ghost" size="sm" onClick={()=>marcarTodos(false)}>Limpar</Btn>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {membros.map(c => {
                const presente = presencas[c.id] ?? false
                return (
                  <button key={c.id} type="button" onClick={()=>toggle(c.id)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'13px 16px', borderRadius:16, cursor:'pointer', width:'100%',
                    fontFamily:"'Nunito',sans-serif", transition:'all 0.15s', textAlign:'left',
                    border: presente ? `2px solid ${t.color}` : '1.5px solid rgba(240,98,146,0.15)',
                    background: presente ? t.light : 'rgba(255,255,255,0.88)',
                    backdropFilter:'blur(6px)',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <Avatar nome={c.nome} fotoUrl={c.foto_url} color={t.color} light={t.light} size={44} radius={13} />
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontSize:13, fontWeight:800, color: presente ? t.text : 'var(--text)' }}>{c.nome}</div>
                        <div style={{ fontSize:11, color: presente ? t.text : 'var(--sub)', fontWeight:700, marginTop:1 }}>
                          {presente ? 'Presente ✓' : 'Toque para marcar'}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width:27, height:27, borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${presente ? t.color : '#CBD5E1'}`,
                      background: presente ? t.color : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all 0.15s',
                    }}>
                      {presente && <CheckIcon style={{ width:14, height:14, color:'white', strokeWidth:3 }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            {salvou ? (
              <div style={{ background:'var(--green-l)', color:'var(--green-d)', borderRadius:14, padding:15, textAlign:'center', fontWeight:900, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <CheckCircleIcon style={{ width:20, height:20 }} /> Chamada salva com sucesso!
              </div>
            ) : (
              <Btn variant="green" fullWidth size="lg" onClick={salvar} disabled={salvando}>
                <CheckIcon style={{ width:16, height:16 }} />
                {salvando ? 'Salvando...' : `Salvar chamada · ${pres} presente${pres !== 1 ? 's' : ''}`}
              </Btn>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── LISTA DE TURMAS ──────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader title="Chamada por Turma" sub={formatDateLong(hoje)} />
      <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }} className="animate-up">

        <div style={{
          background:'linear-gradient(135deg, var(--pink) 0%, var(--purple) 100%)',
          borderRadius:22, padding:'18px 22px', marginBottom:18,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          boxShadow:'0 6px 24px rgba(240,98,146,0.28)',
        }}>
          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:19, color:'white' }}>
              {formatDateLong(hoje)}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3, fontWeight:700 }}>
              Selecione uma turma para registrar a chamada
            </div>
          </div>
          <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
            <CalendarDaysIcon style={{ width:28, height:28 }} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
          {TURMAS_ORDER.map(tid => {
            const t       = TURMA_CONFIG[tid]
            const membros = criancas.filter(c => c.turma === tid)
            const feita   = feitasHoje.has(tid)

            return (
              <Card key={tid} style={{ overflow:'hidden', border:`1.5px solid ${t.color}33`, boxShadow:`0 4px 18px ${t.color}18` }}>
                {/* Header colorido */}
                <div style={{ padding:'16px 18px', background:t.color }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                    <div>
                      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:'white' }}>
                        {TURMA_EMOJI[tid]} {t.label}
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.78)', marginTop:3, fontWeight:700 }}>
                        {t.faixa} · {membros.length} criança{membros.length!==1?'s':''}
                      </div>
                    </div>
                    {feita && (
                      <span style={{ background:'rgba(255,255,255,0.28)', color:'white', fontSize:10, fontWeight:900, padding:'4px 10px', borderRadius:20, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                        <CheckIcon style={{ width:10, height:10, strokeWidth:3 }} /> feita
                      </span>
                    )}
                  </div>
                </div>

                {/* Corpo */}
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12, minHeight:32 }}>
                    {membros.slice(0, 7).map(m => (
                      <span key={m.id} style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800, background:t.light, color:t.text }}>
                        {m.nome.split(' ')[0]}
                      </span>
                    ))}
                    {membros.length > 7 && (
                      <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:800, background:'rgba(240,98,146,0.08)', color:'var(--sub)' }}>
                        +{membros.length - 7}
                      </span>
                    )}
                    {membros.length === 0 && (
                      <span style={{ fontSize:12, color:'var(--sub)', fontWeight:700 }}>Nenhuma criança</span>
                    )}
                  </div>
                  <Btn fullWidth onClick={()=>iniciar(tid)}>
                    <CheckIcon style={{ width:14, height:14 }} />
                    {feita ? 'Refazer chamada' : 'Fazer chamada'}
                  </Btn>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}