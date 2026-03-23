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

  // Função de load separada para poder chamar após salvar
  const load = useCallback(async () => {
    const [resCriancas, resCg] = await Promise.all([
      fetch('/api/criancas'),
      fetch('/api/chamadas-gerais'),
    ])
    const lista: Crianca[]      = resCriancas.ok ? await resCriancas.json() : []
    const cg: ChamadaGeralAPI[] = resCg.ok ? await resCg.json() : []

    // Começa tudo como false
    const init: Record<number, boolean> = {}
    lista.forEach(c => { init[c.id] = false })

    // Se já existe chamada hoje, pré-preenche com os valores salvos
    const chamadaHoje = Array.isArray(cg) ? cg.find(x => x.data === hoje) : null
    if (chamadaHoje) {
      setHojeFeita(true)
      chamadaHoje.presencas_gerais?.forEach(p => { init[p.crianca_id] = p.presente })
    } else {
      setHojeFeita(false)
    }

    setCriancas(lista)
    setPresencas(init)
    setLoading(false)
  }, [hoje])

  useEffect(() => { load() }, [load])

  const toggle = useCallback((id: number) => {
    setPresencas(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const marcarTodos = useCallback((val: boolean) => {
    setPresencas(prev => {
      const n = { ...prev }
      Object.keys(n).forEach(k => { n[Number(k)] = val })
      return n
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
      
      // Limpa todas as seleções
      const selecoesLimpar: Record<number, boolean> = {}
      criancas.forEach(c => { selecoesLimpar[c.id] = false })
      setPresencas(selecoesLimpar)
      
      setTimeout(() => setSalvou(false), 2000)
    }
  }

  const presentes = Object.values(presencas).filter(Boolean).length
  const total     = criancas.length
  const pct       = total > 0 ? Math.round(presentes / total * 100) : 0

  if (loading) return <><PageHeader title="Chamada Geral" sub="Carregando..." /><Loading /></>

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader title="Chamada Geral" sub={formatDateLong(hoje)} />
      <div style={{ flex:1, overflowY:'auto', padding:'14px 14px', WebkitOverflowScrolling:'touch' } as React.CSSProperties} className="animate-up">

        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,var(--pink) 0%,var(--purple) 100%)', borderRadius:20, padding:'16px 18px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 18px rgba(240,98,146,0.28)' }}>
          <div>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:17, color:'white' }}>{formatDateLong(hoje)}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginTop:2, fontWeight:700 }}>Todo o ministério</div>
            {hojeFeita && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.90)', marginTop:4, fontWeight:800 }}>
                ✓ Já registrada hoje — pode atualizar
              </div>
            )}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:36, color:'white', lineHeight:1 }}>{pct}%</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:700 }}>{presentes}/{total}</div>
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
          {[
            { label:'Total',    val:total,           color:'var(--blue)'  },
            { label:'Presentes',val:presentes,        color:'var(--green)' },
            { label:'Ausentes', val:total-presentes,  color:'#E24B4A'      },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.88)', borderRadius:14, border:'1.5px solid rgba(240,98,146,0.12)', padding:'10px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10, color:'var(--sub)', fontWeight:700, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <ProgressBar pct={pct} color="var(--purple)" h={8} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'12px 0 10px' }}>
          <span style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--sub)' }}>Por turma</span>
          <div style={{ display:'flex', gap:6 }}>
            <Btn variant="secondary" size="sm" onClick={()=>marcarTodos(true)}>
              <CheckIcon style={{ width:12,height:12 }} /> Todos
            </Btn>
            <Btn variant="ghost" size="sm" onClick={()=>marcarTodos(false)}>Limpar</Btn>
          </div>
        </div>

        {/* Lista por turma */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
          {TURMAS_ORDER.map(tid => {
            const t       = TURMA_CONFIG[tid]
            const membros = criancas.filter(c => c.turma === tid)
            if (!membros.length) return null

            return (
              <div key={tid} style={{ background:'rgba(255,255,255,0.88)', borderRadius:16, border:`2px solid ${t.color}33`, overflow:'hidden' }}>
                {/* Cabeçalho da turma */}
                <div style={{ padding:'10px 14px', background:t.light, borderBottom:`1.5px solid ${t.color}22`, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>{TURMA_EMOJI[tid]}</span>
                  <span style={{ fontSize:12, fontWeight:900, color:t.text }}>{t.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:t.text, opacity:.65 }}>
                    {membros.filter(c => presencas[c.id]).length}/{membros.length}
                  </span>
                </div>

                {membros.map((c, idx) => {
                  const v = presencas[c.id] ?? false
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'12px 14px', border:'none',
                        background: v ? `${t.light}CC` : 'transparent',
                        cursor:'pointer', width:'100%',
                        fontFamily:"'Nunito',sans-serif",
                        borderBottom: idx < membros.length-1 ? `1px solid ${t.color}15` : 'none',
                        textAlign:'left', minHeight:58,
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar nome={c.nome} color={t.color} light={t.light} size={40} radius={12} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:800, color: v ? t.text : 'var(--text)' }}>{c.nome}</div>
                          <div style={{ fontSize:10, color: v ? t.text : 'var(--sub)', fontWeight:700, marginTop:1 }}>
                            {v ? 'Presente ✓' : 'Toque para marcar'}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        width:30, height:30, borderRadius:'50%', flexShrink:0,
                        border:`2px solid ${v ? t.color : '#CBD5E1'}`,
                        background: v ? t.color : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all 0.15s',
                      }}>
                        {v && <CheckIcon style={{ width:15,height:15,color:'white',strokeWidth:3 }} />}
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
          <div style={{ background:'var(--green-l)', color:'var(--green-d)', borderRadius:16, padding:16, textAlign:'center', fontWeight:900, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <CheckCircleIcon style={{ width:20,height:20 }} /> Chamada salva com sucesso!
          </div>
        ) : (
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            style={{
              width:'100%', padding:16, borderRadius:16, border:'none',
              cursor:salvando?'not-allowed':'pointer',
              fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:900, color:'white',
              background:'linear-gradient(135deg,var(--pink),var(--purple))',
              opacity:salvando?0.7:1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 4px 16px rgba(240,98,146,0.35)', minHeight:52,
            }}
          >
            <CheckIcon style={{ width:18,height:18 }} />
            {salvando
              ? 'Salvando...'
              : hojeFeita
                ? `Atualizar chamada · ${presentes} presente${presentes!==1?'s':''}`
                : `Salvar chamada · ${presentes} presente${presentes!==1?'s':''}`
            }
          </button>
        )}
      </div>
    </div>
  )
}