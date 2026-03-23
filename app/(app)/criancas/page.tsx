'use client'
// app/(app)/criancas/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER, FreqResumo } from '@/types'
import { PageHeader, Avatar, Badge, Btn, Loading, Empty } from '@/components/ui'
import CriancaModal from '@/components/CriancaModal'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { freqColor } from '@/lib/utils'
import { useIsMobile } from '@/lib/useIsMobile'

const TURMA_EMOJI: Record<string, string> = { maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀' }

export default function CriancasPage() {
  const router   = useRouter()
  const isMobile = useIsMobile()

  const [criancas, setCriancas] = useState<Crianca[]>([])
  const [resumo,   setResumo]   = useState<FreqResumo[]>([])
  const [loading,  setLoading]  = useState(true)
  const [busca,    setBusca]    = useState('')
  const [filtro,   setFiltro]   = useState<string>('todas')
  const [modal,    setModal]    = useState(false)

  const load = () => Promise.all([
    fetch('/api/criancas').then(r => r.json()),
    fetch('/api/freq-resumo').then(r => r.json()),
  ]).then(([c, r]) => {
    setCriancas(Array.isArray(c) ? c : [])
    setResumo(Array.isArray(r) ? r : [])
    setLoading(false)
  })

  useEffect(() => { load() }, [])

  const freqMap = Object.fromEntries(resumo.map(r => [r.crianca_id, r]))

  let lista = criancas
  if (busca)            lista = lista.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))
  if (filtro!=='todas') lista = lista.filter(c => c.turma===filtro)

  if (loading) return <><PageHeader title="Crianças" sub="Crianças cadastradas" /><Loading /></>

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader title="Crianças" sub={`${criancas.length} cadastradas`}
        actions={
          <Btn onClick={()=>setModal(true)}>
            <PlusIcon style={{ width:14,height:14 }} /> {isMobile ? 'Nova' : 'Nova criança'}
          </Btn>
        }
      />

      {/* padding menor no mobile */}
      <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '12px 14px' : '16px 24px' } as React.CSSProperties} className="animate-up">

        {/* Busca */}
        <div style={{ position:'relative', marginBottom:12 }}>
          <MagnifyingGlassIcon style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'var(--sub)' }} />
          <input
            value={busca}
            onChange={e=>setBusca(e.target.value)}
            placeholder="Buscar pelo nome..."
            style={{
              width:'100%', padding:'11px 14px 11px 38px',
              border:'1.5px solid rgba(240,98,146,0.22)', borderRadius:14,
              fontFamily:"'Nunito',sans-serif",
              /* 16px evita zoom automático no iOS */
              fontSize: isMobile ? 16 : 13,
              fontWeight:600, color:'var(--text)',
              background:'rgba(255,255,255,0.85)', outline:'none', backdropFilter:'blur(6px)',
            }}
          />
        </div>

        {/* Filtros — scroll horizontal no mobile, wrap no desktop */}
        <div style={{
          display:'flex', gap:7, marginBottom:16,
          flexWrap:  isMobile ? 'nowrap'   : 'wrap',
          overflowX: isMobile ? 'auto'     : 'visible',
          paddingBottom: isMobile ? 4 : 0,
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}>
          {[
            { id:'todas', label:`🌈 Todas (${criancas.length})` },
            ...TURMAS_ORDER.map(id => ({
              id,
              label: `${TURMA_EMOJI[id]} ${isMobile ? TURMA_CONFIG[id].label.split(' ')[0] : TURMA_CONFIG[id].label} (${criancas.filter(c=>c.turma===id).length})`
            }))
          ].map(f => {
            const t = f.id!=='todas' ? TURMA_CONFIG[f.id as keyof typeof TURMA_CONFIG] : null
            const activeColor = t?.color ?? 'var(--pink)'
            return (
              <button key={f.id} onClick={()=>setFiltro(f.id)} style={{
                padding:'7px 15px', borderRadius:22, fontSize:11, fontWeight:800,
                cursor:'pointer', border:'1.5px solid', transition:'all 0.15s',
                whiteSpace:'nowrap', flexShrink:0, fontFamily:"'Nunito',sans-serif",
                background:  filtro===f.id ? activeColor                : 'rgba(255,255,255,0.80)',
                color:       filtro===f.id ? 'white'                    : 'var(--sub)',
                borderColor: filtro===f.id ? activeColor                : 'rgba(240,98,146,0.20)',
                backdropFilter:'blur(4px)',
                boxShadow:   filtro===f.id ? `0 3px 12px ${activeColor}44` : 'none',
              }}>
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Lista — estrutura ORIGINAL com div + onClick + router.push */}
        {lista.length===0
          ? <Empty msg="Nenhuma criança encontrada 🌸" />
          : <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {lista.map(c => {
                const t = TURMA_CONFIG[c.turma]
                const f = freqMap[c.id]
                return (
                  <div
                    key={c.id}
                    onClick={()=>router.push(`/criancas/${c.id}`)}
                    style={{
                      background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)',
                      borderRadius:18, border:'1.5px solid rgba(240,98,146,0.14)',
                      padding: isMobile ? '12px 14px' : '12px 16px',
                      display:'flex', alignItems:'center',
                      gap: isMobile ? 12 : 13,
                      cursor:'pointer', transition:'all 0.16s',
                      boxShadow:'0 2px 10px rgba(240,98,146,0.07)',
                      /* Altura mínima confortável no mobile */
                      minHeight: isMobile ? 64 : 'auto',
                    }}
                    onMouseOver={e=>{ e.currentTarget.style.borderColor=t.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${t.color}22` }}
                    onMouseOut={e=>{  e.currentTarget.style.borderColor='rgba(240,98,146,0.14)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 10px rgba(240,98,146,0.07)' }}
                  >
                    <Avatar nome={c.nome} color={t.color} light={t.light} size={isMobile ? 44 : 46} radius={14} />

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {c.nome}
                      </div>
                      <div style={{ fontSize:11, color:'var(--sub)', fontWeight:600, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        👪 {c.responsavel}
                        {/* Telefone só no desktop para não amontoar */}
                        {!isMobile && <> &nbsp;·&nbsp; 📞 {c.telefone}</>}
                      </div>
                    </div>

                    <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      <Badge bg={t.light} color={t.text}>
                        {TURMA_EMOJI[c.turma]} {isMobile ? t.label.split(' ')[0] : t.label}
                      </Badge>
                      {f
                        ? <span style={{ fontSize:12, fontWeight:900, color:freqColor(f.pct) }}>{f.pct}%</span>
                        : <span style={{ fontSize:10, color:'var(--sub)' }}>sem dados</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>

      {modal && (
        <CriancaModal
          onClose={()=>setModal(false)}
          onSaved={c => {
            setCriancas(prev => [...prev, c].sort((a,b)=>a.nome.localeCompare(b.nome)))
            setModal(false)
          }}
        />
      )}
    </div>
  )
}