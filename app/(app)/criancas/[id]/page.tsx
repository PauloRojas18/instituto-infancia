'use client'
// app/(app)/criancas/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  PhoneIcon, PencilSquareIcon, ArrowLeftIcon,
  ExclamationTriangleIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { Crianca, TURMA_CONFIG, HistoricoItem, Turma } from '@/types'
import { PageHeader, Card, CardHeader, Badge, Btn, Loading } from '@/components/ui'
import CriancaModal from '@/components/CriancaModal'
import { formatDate } from '@/lib/utils'

const TURMA_EMOJI: Record<string, string> = { maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀' }

interface FreqResponse {
  historico: HistoricoItem[]
  total:     number
  presentes: number
  pct:       number | null
}

export default function CriancaPage() {
  const router = useRouter()
  const params = useParams()
  const id     = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [crianca,   setCrianca]   = useState<Crianca | null>(null)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [total,     setTotal]     = useState(0)
  const [presentes, setPresentes] = useState(0)
  const [pct,       setPct]       = useState<number | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const [rc, rp] = await Promise.all([
        fetch(`/api/criancas/${id}`),
        fetch(`/api/presencas?criancaId=${id}`),
      ])
      if (rc.ok) setCrianca(await rc.json() as Crianca)
      if (rp.ok) {
        const d = await rp.json() as FreqResponse
        setHistorico(d.historico ?? [])
        setTotal(d.total ?? 0)
        setPresentes(d.presentes ?? 0)
        setPct(d.pct ?? null)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <><PageHeader title="Crianças" sub="Carregando..." /><Loading /></>
  if (!crianca) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:12 }}>
      <p style={{ fontSize:14, color:'var(--sub)' }}>Criança não encontrada 🌸</p>
      <Btn variant="ghost" onClick={()=>router.push('/criancas')}>
        <ArrowLeftIcon style={{ width:14,height:14 }} /> Voltar
      </Btn>
    </div>
  )

  const t         = TURMA_CONFIG[crianca.turma]
  const temAlerta = total>0 && (pct??100)<75
  const freqPlena = total>0 && pct===100
  const emoji     = TURMA_EMOJI[crianca.turma]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader title="Crianças" sub="Perfil individual"
        actions={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" size="sm" onClick={()=>router.push('/criancas')}>
              <ArrowLeftIcon style={{ width:14,height:14 }} /> Voltar
            </Btn>
            <Btn variant="secondary" size="sm" onClick={()=>setModal(true)}>
              <PencilSquareIcon style={{ width:14,height:14 }} /> Editar
            </Btn>
          </div>
        }
      />

      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }} className="animate-up">
        <div style={{ maxWidth:680 }}>

          {/* ── HERO ── */}
          <div style={{
            borderRadius:24, overflow:'hidden', marginBottom:16,
            background:`linear-gradient(135deg, ${t.color} 0%, ${t.color}BB 100%)`,
            boxShadow:`0 8px 30px ${t.color}40`,
          }}>
            <div style={{ padding:'24px 24px 20px', display:'flex', alignItems:'flex-start', gap:18 }}>

              {/* Foto em destaque */}
              <div style={{
                width:84, height:84, borderRadius:22, flexShrink:0,
                overflow:'hidden',
                border:'3px solid rgba(255,255,255,0.45)',
                boxShadow:'0 4px 18px rgba(0,0,0,0.18)',
                background:'rgba(255,255,255,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {crianca.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={crianca.foto_url}
                    alt={crianca.nome}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    onError={(e) => {
                      const el = e.currentTarget
                      el.style.display = 'none'
                      const p = el.parentElement
                      if (p) {
                        p.style.fontFamily = "'Fredoka One', cursive"
                        p.style.fontSize = '28px'
                        p.style.color    = 'white'
                        p.textContent    = crianca.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()
                      }
                    }}
                  />
                ) : (
                  <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:'white' }}>
                    {crianca.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:23, color:'white', lineHeight:1.15 }}>
                  {crianca.nome}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.82)', fontWeight:700, marginTop:4 }}>
                  {emoji} {t.label} · {t.faixa}
                </div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:11 }}>
                  {pct!==null && (
                    <span style={{ background:'rgba(255,255,255,0.24)', color:'white', fontSize:11, fontWeight:800, padding:'4px 11px', borderRadius:20 }}>
                      {presentes}/{total} presenças
                    </span>
                  )}
                  {temAlerta && (
                    <span style={{ background:'rgba(255,255,255,0.24)', color:'white', fontSize:11, fontWeight:800, padding:'4px 11px', borderRadius:20, display:'flex', alignItems:'center', gap:4 }}>
                      <ExclamationTriangleIcon style={{ width:12,height:12 }} /> Abaixo de 75%
                    </span>
                  )}
                  {freqPlena && (
                    <span style={{ background:'rgba(255,255,255,0.24)', color:'white', fontSize:11, fontWeight:800, padding:'4px 11px', borderRadius:20, display:'flex', alignItems:'center', gap:4 }}>
                      <CheckCircleIcon style={{ width:12,height:12 }} /> Frequência plena 🌟
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign:'right', flexShrink:0 }}>
                {pct!==null ? (
                  <>
                    <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'white', lineHeight:1 }}>{pct}%</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:700 }}>frequência</div>
                  </>
                ) : (
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:700 }}>sem<br/>chamadas</div>
                )}
              </div>
            </div>
          </div>

          {/* Alerta */}
          {temAlerta && (
            <div style={{ background:'rgba(252,235,235,0.92)', border:'1.5px solid #F09595', borderRadius:14, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
              <ExclamationTriangleIcon style={{ width:18, height:18, color:'#A32D2D', flexShrink:0 }} />
              <div>
                <div style={{ fontSize:12, fontWeight:900, color:'#A32D2D' }}>Frequência abaixo de 75%</div>
                <div style={{ fontSize:11, color:'#793F3F', fontWeight:600, marginTop:1 }}>Entre em contato com o responsável.</div>
              </div>
            </div>
          )}

          {/* Informações */}
          <Card style={{ overflow:'hidden', marginBottom:14 }}>
            <CardHeader title="📋 Informações" action={
              <Btn variant="ghost" size="sm" onClick={()=>setModal(true)}>
                <PencilSquareIcon style={{ width:13,height:13 }} /> Editar
              </Btn>
            } />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:14 }}>
              <div style={{ background:'rgba(255,255,255,0.8)', borderRadius:14, padding:'12px 14px', border:'1.5px solid rgba(240,98,146,0.12)' }}>
                <div style={{ fontSize:10, color:'var(--sub)', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.6px' }}>Responsável</div>
                <div style={{ fontSize:13, fontWeight:700, marginTop:4 }}>👪 {crianca.responsavel}</div>
              </div>
              <div style={{ background:'rgba(255,255,255,0.8)', borderRadius:14, padding:'12px 14px', border:'1.5px solid rgba(240,98,146,0.12)' }}>
                <div style={{ fontSize:10, color:'var(--sub)', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.6px' }}>Telefone</div>
                <a href={`tel:${crianca.telefone}`} style={{ fontSize:13, fontWeight:700, color:'var(--blue-d)', textDecoration:'none', marginTop:4, display:'flex', alignItems:'center', gap:5 }}>
                  <PhoneIcon style={{ width:13,height:13 }} />{crianca.telefone}
                </a>
              </div>
              <div style={{ background:'rgba(255,255,255,0.8)', borderRadius:14, padding:'12px 14px', border:'1.5px solid rgba(240,98,146,0.12)', gridColumn:'1/-1' }}>
                <div style={{ fontSize:10, color:'var(--sub)', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.6px' }}>Endereço</div>
                <div style={{ fontSize:13, fontWeight:700, marginTop:4 }}>📍 {crianca.endereco||'—'}</div>
              </div>
            </div>
          </Card>

          {/* Observações */}
          {crianca.obs && (
            <div style={{ background:'rgba(255,253,231,0.92)', border:'1.5px solid #FFE082', borderRadius:14, padding:'13px 16px', marginBottom:14, backdropFilter:'blur(6px)' }}>
              <div style={{ fontSize:10, fontWeight:900, color:'var(--yellow-d)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>📝 Observações</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#5D4037', lineHeight:1.5 }}>{crianca.obs}</div>
            </div>
          )}

          {/* Histórico */}
          <Card style={{ overflow: 'hidden', marginBottom: 16 }}>
            <CardHeader
              title="📅 Histórico de presençasdasdasd"
              action={
                pct !== null ? (
                  <Badge
                    bg={pct >= 75 ? 'var(--green-l)' : '#FCEBEB'}
                    color={pct >= 75 ? 'var(--green-d)' : '#A32D2D'}
                  >
                    {presentes}/{total}
                  </Badge>
                ) : undefined
              }
            />

            {/* Barra de frequência */}
            {total > 0 && pct !== null && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(240,98,146,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--sub)', marginBottom: 6 }}>
                  <span>Frequência geral</span>
                  <span style={{ color: pct >= 75 ? 'var(--green-d)' : '#A32D2D' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 4,
                    width: `${pct}%`,
                    background: pct >= 75 ? 'var(--green-d)' : '#E24B4A',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {historico.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--sub)', fontSize: 12, fontWeight: 800 }}>
                Nenhum registro ainda 🌱
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {historico.map((h, i) => {
                  const ht     = h.turma ? TURMA_CONFIG[h.turma as Turma] : null
                  const hEmoji = h.turma ? TURMA_EMOJI[h.turma] : ''
                  const label  = h.tipo === 'geral'
                    ? 'Chamada geral'
                    : ht ? `${hEmoji} ${ht.label}` : '—'

                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 16px',
                        borderBottom: '1px solid rgba(240,98,146,0.07)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{formatDate(h.data)}</div>
                        <div style={{ fontSize: 10, color: 'var(--sub)', fontWeight: 700, marginTop: 2 }}>{label}</div>
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 13px',
                        borderRadius: 20,
                        background: h.presente ? 'var(--green-l)' : '#FCEBEB',
                        color:      h.presente ? 'var(--green-d)' : '#A32D2D',
                      }}>
                        {h.presente ? '✓ Presente' : '✗ Ausente'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Ações */}
          <div style={{ display:'flex', gap:10 }}>
            <a href={`tel:${crianca.telefone}`} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'13px', borderRadius:16, background:'var(--pink)', color:'white', textDecoration:'none', fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:800, boxShadow:'0 4px 16px rgba(240,98,146,0.35)' }}>
              <PhoneIcon style={{ width:16,height:16 }} /> Ligar para responsável
            </a>
          </div>
        </div>
      </div>

      {modal && crianca && (
        <CriancaModal initial={crianca} onClose={()=>setModal(false)} onSaved={c=>{setCrianca(c); setModal(false)}} />
      )}
    </div>
  )
}