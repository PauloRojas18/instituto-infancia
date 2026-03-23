'use client'
// app/(app)/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER, FreqResumo } from '@/types'
import { PageHeader, Card, CardHeader, StatCard, Avatar, Badge, ProgressBar, Btn, Loading, Empty } from '@/components/ui'
import { UserGroupIcon, BookOpenIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { freqColor } from '@/lib/utils'
import { useIsMobile } from '@/lib/useIsMobile'

const TURMA_EMOJI: Record<string, string> = { maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀' }

export default function DashboardPage() {
  const router   = useRouter()
  const isMobile = useIsMobile()

  const [criancas, setCriancas] = useState<Crianca[]>([])
  const [resumo,   setResumo]   = useState<FreqResumo[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/criancas').then(r => r.json()),
      fetch('/api/freq-resumo').then(r => r.json()),
    ]).then(([c, r]) => {
      setCriancas(Array.isArray(c) ? c : [])
      setResumo(Array.isArray(r) ? r : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <><PageHeader title="Dashboard" sub="Visão geral" /><Loading /></>

  const freqMap = Object.fromEntries(resumo.map(r => [r.crianca_id, r]))
  const alertas = criancas.filter(c => { const f=freqMap[c.id]; return f && f.pct < 75 })

  const freqTurma = (turmaId: string) => {
    const ids  = criancas.filter(c => c.turma===turmaId).map(c => c.id)
    const rows = resumo.filter(r => ids.includes(r.crianca_id))
    if (!rows.length) return null
    const tot=rows.reduce((a,r)=>a+r.total,0), pre=rows.reduce((a,r)=>a+r.presentes,0)
    return tot>0 ? Math.round(pre/tot*100) : null
  }

  let totalPres=0, totalCham=0
  resumo.forEach(r => { totalPres+=r.presentes; totalCham+=r.total })
  const freqGlobal = totalCham>0 ? Math.round(totalPres/totalCham*100) : 0

  const pad = isMobile ? '12px 14px' : '20px 24px'
  const btnLabel = isMobile ? '✏️ Chamada' : '✏️ Fazer chamada'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader
        title="Dashboard"
        sub="Visão geral"
        actions={
          <Btn variant="secondary" size="sm" onClick={()=>router.push('/chamada-turma')}>
            {btnLabel}
          </Btn>
        }
      />
      <div style={{ flex:1, overflowY:'auto', padding:pad } as React.CSSProperties} className="animate-up">

        {/* Stats: 2×2 mobile / 4 colunas desktop */}
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
          gap: isMobile ? 10 : 14,
          marginBottom: isMobile ? 12 : 18,
        }}>
          <StatCard icon={<UserGroupIcon style={{ width:20,height:20 }} />}             value={criancas.length}        label="Crianças"   color="var(--pink)"   />
          <StatCard icon={<BookOpenIcon style={{ width:20,height:20 }} />}              value={TURMAS_ORDER.length}    label="Turmas"     color="var(--blue)"   />
          <StatCard icon={<ClipboardDocumentListIcon style={{ width:20,height:20 }} />} value={`${freqGlobal}%`}       label="Frequência" color="var(--green)"  />
          <StatCard icon={<ExclamationTriangleIcon style={{ width:20,height:20 }} />}   value={alertas.length}         label="Alertas"    color={alertas.length>0?'var(--orange)':'var(--green)'} />
        </div>

        {/* Cards: coluna única no mobile / lado a lado no desktop */}
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 12 : 16,
        }}>

          {/* Turmas */}
          <Card style={{ overflow:'hidden' }}>
            <CardHeader title="🎒 Turmas" action={
              <Btn variant="secondary" size="sm" onClick={()=>router.push('/chamada-turma')}>Fazer chamada</Btn>
            } />
            {TURMAS_ORDER.map(tid => {
              const t   = TURMA_CONFIG[tid]
              const cnt = criancas.filter(c=>c.turma===tid).length
              const pct = freqTurma(tid)
              return (
                <div key={tid} style={{ padding:'11px 14px', borderBottom:'1px solid rgba(240,98,146,0.08)', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:11, background:t.light, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:17 }}>
                    {TURMA_EMOJI[tid]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'var(--text)' }}>{t.label}</div>
                    <div style={{ fontSize:10, color:'var(--sub)', fontWeight:600 }}>{cnt} criança{cnt!==1?'s':''}</div>
                    {pct!==null && <ProgressBar pct={pct} color={pct>=75?t.color:'#E24B4A'} h={5} />}
                  </div>
                  {pct!==null
                    ? <span style={{ fontSize:13, fontWeight:900, color:freqColor(pct), flexShrink:0 }}>{pct}%</span>
                    : <span style={{ fontSize:10, color:'var(--sub)', flexShrink:0 }}>sem dados</span>
                  }
                </div>
              )
            })}
          </Card>

          {/* Alertas */}
          <Card style={{ overflow:'hidden' }}>
            <CardHeader
              title={<span style={{ display:'flex', alignItems:'center', gap:6 }}>⚠️ Alertas de falta</span>}
              action={alertas.length>0 ? <Badge bg="#FCEBEB" color="#A32D2D">{alertas.length}</Badge> : undefined}
            />
            {alertas.length===0
              ? <Empty msg="🎉 Nenhum alerta no momento!" />
              : <div style={{ maxHeight: isMobile ? 'none' : 280, overflowY: isMobile ? 'visible' : 'auto' }}>
                  {alertas.map(c => {
                    const t=TURMA_CONFIG[c.turma]; const f=freqMap[c.id]
                    return (
                      <div key={c.id}
                        onClick={()=>router.push(`/criancas/${c.id}`)}
                        style={{ padding:'10px 14px', borderBottom:'1px solid rgba(240,98,146,0.08)', display:'flex', alignItems:'center', gap:10, cursor:'pointer', minHeight: isMobile ? 52 : 44 }}
                        onMouseOver={e=>(e.currentTarget.style.background='rgba(255,235,243,0.6)')}
                        onMouseOut={e=>(e.currentTarget.style.background='')}>
                        <Avatar nome={c.nome} color={t.color} light={t.light} size={36} radius={10} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</div>
                          <div style={{ fontSize:10, color:'var(--sub)', fontWeight:700 }}>{TURMA_EMOJI[c.turma]} {t.label}</div>
                        </div>
                        <Badge bg="#FCEBEB" color="#A32D2D">{f?.pct ?? 0}%</Badge>
                      </div>
                    )
                  })}
                </div>
            }
          </Card>
        </div>
      </div>
    </div>
  )
}