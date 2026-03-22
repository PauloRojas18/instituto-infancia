'use client'
// app/(app)/chamada-geral/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER } from '@/types'
import { PageHeader, Btn, ProgressBar, Avatar, Loading } from '@/components/ui'
import { CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { formatDateLong, getToday } from '@/lib/utils'

const TURMA_EMOJI: Record<string, string> = { maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀' }

interface ChamadaGeralAPI {
  data: string
  presencas_gerais: { crianca_id: number; presente: boolean }[]
}

export default function ChamadaGeralPage() {
  const hoje = getToday()

  const [criancas,  setCriancas]  = useState<Crianca[]>([])
  const [presencas, setPresencas] = useState<Record<number, boolean>>({})
  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState(false)
  const [salvou,    setSalvou]    = useState(false)
  const [hojeFeita, setHojeFeita] = useState(false)

  // ── Carregar dados UMA VEZ (useEffect com [] vazio) ────────
  // O bug anterior era que o useEffect NÃO tinha dependências `[]`,
  // então rodava em loop infinito → toda render buscava a API →
  // o estado mudava → nova render → novo fetch → desmarcar
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [resCriancas, resCg] = await Promise.all([
        fetch('/api/criancas'),
        fetch('/api/chamadas-gerais'),
      ])

      if (cancelled) return

      const lista: Crianca[] = resCriancas.ok ? await resCriancas.json() : []
      const cg: ChamadaGeralAPI[] = resCg.ok ? await resCg.json() : []

      // Inicializa todas as presenças como false
      const init: Record<number, boolean> = {}
      lista.forEach(c => { init[c.id] = false })

      // Se já tiver chamada hoje, pré-popula com os valores salvos
      const chamadaHoje = Array.isArray(cg) ? cg.find(x => x.data === hoje) : null
      if (chamadaHoje) {
        setHojeFeita(true)
        chamadaHoje.presencas_gerais?.forEach(p => {
          init[p.crianca_id] = p.presente
        })
      }

      setCriancas(lista)
      setPresencas(init)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [hoje]) // ← dependência estável (hoje não muda durante a sessão)

  // Toggle individual — atualiza só o ID clicado, sem re-fetch
  const toggle = useCallback((id: number) => {
    setPresencas(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const marcarTodos = useCallback((val: boolean) => {
    setPresencas(prev => {
      const novo = { ...prev }
      Object.keys(novo).forEach(k => { novo[Number(k)] = val })
      return novo
    })
  }, [])

  const salvar = async () => {
    setSalvando(true)
    const res = await fetch('/api/chamadas-gerais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: hoje,
        presencas: criancas.map(c => ({ criancaId: c.id, presente: presencas[c.id] ?? false })),
      }),
    })
    setSalvando(false)
    if (res.ok) {
      setSalvou(true)
      setHojeFeita(true)
      setTimeout(() => setSalvou(false), 2500)
    }
  }

  const presentes = Object.values(presencas).filter(Boolean).length
  const total     = criancas.length
  const pct       = total > 0 ? Math.round(presentes / total * 100) : 0

  if (loading) return <><PageHeader title="Chamada Geral" sub="Carregando..." /><Loading /></>

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader title="Chamada Geral" sub={formatDateLong(hoje)} />
      <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }} className="animate-up">
        <div style={{ maxWidth:620, margin:'0 auto' }}>

          {/* Hero */}
          <div style={{
            background:'linear-gradient(135deg, var(--pink) 0%, var(--purple) 100%)',
            borderRadius:22, padding:'18px 22px', marginBottom:16,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            boxShadow:'0 6px 24px rgba(240,98,146,0.30)',
          }}>
            <div>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:19, color:'white' }}>{formatDateLong(hoje)}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3, fontWeight:700 }}>Chamada de todo o ministério</div>
              {hojeFeita && (
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.88)', marginTop:5, fontWeight:800 }}>
                  ✓ Já registrada hoje — pode atualizar
                </div>
              )}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'white', lineHeight:1 }}>{pct}%</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:700 }}>{presentes}/{total}</div>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            {[
              { label:'Total',     val:total,            color:'var(--blue)'  },
              { label:'Presentes', val:presentes,        color:'var(--green)' },
              { label:'Ausentes',  val:total-presentes,  color:'#E24B4A'      },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)', borderRadius:16, border:'1.5px solid rgba(240,98,146,0.14)', padding:'12px 14px', textAlign:'center', boxShadow:'0 2px 10px rgba(240,98,146,0.07)' }}>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--sub)', fontWeight:700, marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <ProgressBar pct={pct} color="var(--purple)" h={10} />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'14px 0 12px' }}>
            <span style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--sub)' }}>
              Crianças por turma
            </span>
            <div style={{ display:'flex', gap:6 }}>
              <Btn variant="secondary" size="sm" onClick={()=>marcarTodos(true)}>
                <CheckIcon style={{ width:12, height:12 }} /> Todos
              </Btn>
              <Btn variant="ghost" size="sm" onClick={()=>marcarTodos(false)}>Limpar</Btn>
            </div>
          </div>

          {/* Lista por turma */}
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
            {TURMAS_ORDER.map(tid => {
              const t       = TURMA_CONFIG[tid]
              const membros = criancas.filter(c => c.turma === tid)
              if (!membros.length) return null

              return (
                <div key={tid} style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)', borderRadius:18, border:'1.5px solid rgba(240,98,146,0.14)', overflow:'hidden', boxShadow:'0 2px 10px rgba(240,98,146,0.07)' }}>
                  {/* Header da turma */}
                  <div style={{ padding:'10px 16px', background:t.light, borderBottom:`1.5px solid ${t.color}22`, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>{TURMA_EMOJI[tid]}</span>
                    <span style={{ fontSize:12, fontWeight:900, color:t.text }}>{t.label}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:t.text, opacity:.65 }}>
                      {membros.length} criança{membros.length!==1?'s':''}
                    </span>
                  </div>

                  {/* Botões individuais — cada um é independente */}
                  {membros.map((c, idx) => {
                    const v = presencas[c.id] ?? false
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(c.id)}
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'11px 16px',
                          border:'none',
                          background: v ? `${t.light}CC` : 'transparent',
                          cursor:'pointer',
                          width:'100%',
                          fontFamily:"'Nunito',sans-serif",
                          borderBottom: idx < membros.length - 1 ? '1px solid rgba(240,98,146,0.08)' : 'none',
                          transition:'background 0.15s',
                          textAlign:'left',
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar nome={c.nome} fotoUrl={c.foto_url} color={t.color} light={t.light} size={38} radius={11} />
                          <div>
                            <div style={{ fontSize:12, fontWeight:800, color: v ? t.text : 'var(--text)' }}>
                              {c.nome}
                            </div>
                            <div style={{ fontSize:10, color: v ? t.text : 'var(--sub)', fontWeight:700, marginTop:1 }}>
                              {v ? 'Presente ✓' : 'Toque para marcar'}
                            </div>
                          </div>
                        </div>
                        {/* Check circle */}
                        <div style={{
                          width:26, height:26, borderRadius:'50%', flexShrink:0,
                          border:`2px solid ${v ? t.color : '#CBD5E1'}`,
                          background: v ? t.color : 'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all 0.15s',
                        }}>
                          {v && <CheckIcon style={{ width:13, height:13, color:'white', strokeWidth:3 }} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Botão salvar */}
          {salvou ? (
            <div style={{ background:'var(--green-l)', color:'var(--green-d)', borderRadius:16, padding:15, textAlign:'center', fontWeight:900, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <CheckCircleIcon style={{ width:20, height:20 }} /> Chamada salva!
            </div>
          ) : (
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              style={{
                width:'100%', padding:14, borderRadius:16, border:'none',
                cursor: salvando ? 'not-allowed' : 'pointer',
                fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:900, color:'white',
                background:'linear-gradient(135deg, var(--pink), var(--purple))',
                opacity: salvando ? 0.7 : 1,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:'0 4px 18px rgba(240,98,146,0.35)',
              }}
            >
              <CheckIcon style={{ width:16, height:16 }} />
              {hojeFeita ? 'Atualizar chamada' : 'Salvar chamada'} · {presentes} presente{presentes!==1?'s':''}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}