'use client'
// app/(app)/relatorios/page.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER, FreqResumo } from '@/types'
import { PageHeader, Card, CardHeader, StatCard, ProgressBar, Loading, Empty } from '@/components/ui'
import {
  UserGroupIcon, ChartBarIcon, ExclamationTriangleIcon,
  ArrowDownTrayIcon, CloudArrowUpIcon, CheckCircleIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { freqColor } from '@/lib/utils'
import { useIsMobile } from '@/lib/useIsMobile'

const CLIENT_ID   = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID  ?? ''
const FOLDER_ID   = process.env.NEXT_PUBLIC_DRIVE_FOLDER_ID   ?? ''
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

declare global { interface Window { google: { accounts: { oauth2: { initTokenClient: (cfg: GoogleOAuthConfig) => TokenClient } } } } }
interface TokenClient   { requestAccessToken: () => void }
interface OAuthResponse { access_token?: string; error?: string }
interface GoogleOAuthConfig { client_id: string; scope: string; callback: (resp: OAuthResponse) => void }

const TURMA_EMOJI: Record<string, string> = { maternal:'🍼', jardim:'🌻', nivel2a:'⭐', nivel2b:'🚀' }

export default function RelatoriosPage() {
  const router    = useRouter()
  const isMobile  = useIsMobile()

  const [criancas, setCriancas] = useState<Crianca[]>([])
  const [resumo,   setResumo]   = useState<FreqResumo[]>([])
  const [loading,  setLoading]  = useState(true)
  const [salvando,   setSalvando]   = useState<string | null>(null)
  const [savedLinks, setSavedLinks] = useState<Record<string, string>>({})
  const [driveError, setDriveError] = useState<string | null>(null)
  const tokenClientRef = useRef<TokenClient | null>(null)
  const tokenRef       = useRef<string | null>(null)
  const pendingRef     = useRef<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/criancas').then(r => r.json()),
      fetch('/api/freq-resumo').then(r => r.json()),
    ]).then(([c, r]) => {
      setCriancas(Array.isArray(c) ? c : [])
      setResumo(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }, [])

  const uploadDrive = useCallback(async (tipo: string, token: string) => {
    setSalvando(tipo); setDriveError(null)
    try {
      const ano = String(new Date().getFullYear())
      const qPasta = encodeURIComponent(`name='${ano}' and mimeType='application/vnd.google-apps.folder' and '${FOLDER_ID}' in parents and trashed=false`)
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qPasta}&fields=files(id)`, { headers: { Authorization: `Bearer ${token}` } })
      if (!searchRes.ok) throw new Error(`Drive API ${searchRes.status}`)
      const searchData = await searchRes.json() as { files: { id: string }[] }
      let pastaId: string
      if (searchData.files?.length > 0) {
        pastaId = searchData.files[0].id
      } else {
        const crRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ name:ano, mimeType:'application/vnd.google-apps.folder', parents:[FOLDER_ID] }) })
        if (!crRes.ok) throw new Error('Erro ao criar pasta')
        pastaId = (await crRes.json() as { id: string }).id
      }
      const exportRes = await fetch(`/api/exportar/${tipo}`)
      if (!exportRes.ok) throw new Error('Erro ao gerar arquivo')
      const blob = await exportRes.blob()
      const dataHoje = new Date().toISOString().split('T')[0]
      const nomeArq  = `infancia_${tipo}_${dataHoje}.xlsx`
      const metaStr  = JSON.stringify({ name:nomeArq, parents:[pastaId] })
      const enc = new TextEncoder(); const boundary = 'infancia_bound'
      const metaPart = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaStr}\r\n`)
      const filePart = enc.encode(`--${boundary}\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`)
      const ending   = enc.encode(`\r\n--${boundary}--`)
      const arrBuf   = await blob.arrayBuffer()
      const body     = new Uint8Array(metaPart.length + filePart.length + arrBuf.byteLength + ending.length)
      body.set(metaPart,0); body.set(filePart,metaPart.length); body.set(new Uint8Array(arrBuf),metaPart.length+filePart.length); body.set(ending,metaPart.length+filePart.length+arrBuf.byteLength)
      const upRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':`multipart/related; boundary=${boundary}` }, body })
      if (upRes.status===401) { tokenRef.current=null; pendingRef.current=tipo; tokenClientRef.current?.requestAccessToken(); return }
      if (!upRes.ok) throw new Error(`Upload falhou: ${upRes.status}`)
      const upData = await upRes.json() as { id:string; webViewLink:string }
      setSavedLinks(prev => ({ ...prev, [tipo]: upData.webViewLink }))
    } catch (e) {
      setDriveError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally { setSalvando(null) }
  }, [])

  useEffect(() => {
    if (!CLIENT_ID) return
    const init = () => {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: DRIVE_SCOPE,
        callback: (resp: OAuthResponse) => {
          if (resp.error || !resp.access_token) { setDriveError(`Auth Google: ${resp.error ?? 'sem token'}`); return }
          tokenRef.current = resp.access_token
          if (pendingRef.current) { const t=pendingRef.current; pendingRef.current=null; uploadDrive(t, resp.access_token) }
        },
      })
    }
    if (window.google?.accounts?.oauth2) init()
    else { const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true; s.onload=init; document.head.appendChild(s) }
  }, [uploadDrive])

  const handleDrive = (tipo: string) => {
    const token = tokenRef.current
    if (token) uploadDrive(tipo, token)
    else { pendingRef.current=tipo; tokenClientRef.current?.requestAccessToken() }
  }

  const freqMap  = Object.fromEntries(resumo.map(r => [r.crianca_id, r]))
  const alertas  = criancas.filter(c => { const f=freqMap[c.id]; return f && f.pct < 75 })
  const ranking  = criancas.map(c => ({ ...c, ...(freqMap[c.id] ?? { total:0, presentes:0, pct:0 }) })).filter(c => c.total > 0).sort((a,b) => b.pct - a.pct)

  const freqTurma = (tid: string) => {
    const ids  = criancas.filter(c => c.turma===tid).map(c => c.id)
    const rows = resumo.filter(r => ids.includes(r.crianca_id))
    if (!rows.length) return null
    const tot=rows.reduce((a,r)=>a+r.total,0), pre=rows.reduce((a,r)=>a+r.presentes,0)
    return tot>0 ? Math.round(pre/tot*100) : null
  }

  let totG=0, preG=0
  resumo.forEach(r => { totG+=r.total; preG+=r.presentes })
  const freqGlobal = totG>0 ? Math.round(preG/totG*100) : 0

  const exportacoes = [
    { tipo:'criancas', titulo:'Lista de crianças', sub:`${criancas.length} cadastradas`,   color:'var(--pink)',   bg:'var(--pink-l)'   },
    { tipo:'turmas',   titulo:'Lista por turma',   sub:'Agrupado por turma',               color:'var(--blue)',   bg:'var(--blue-l)'   },
    { tipo:'alertas',  titulo:'Alertas de falta',  sub:`${alertas.length} abaixo de 75%`, color:'var(--orange)', bg:'var(--orange-l)' },
    { tipo:'chamada',  titulo:'Planilha de chamada',sub:'Formato institucional',           color:'var(--purple)', bg:'var(--purple-l)' },
  ]

  if (loading) return <><PageHeader title="Relatórios" sub="Carregando..." /><Loading /></>

  const pad = isMobile ? '12px 14px' : '20px 22px'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <PageHeader title="Relatórios" sub="Frequência, rankings e exportações" />
      <div style={{ flex:1, overflowY:'auto', padding:pad } as React.CSSProperties} className="animate-up">

        {/* Avisos */}
        {driveError && (
          <div style={{ background:'#FCEBEB', border:'1.5px solid #F09595', borderRadius:12, padding:'10px 13px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#A32D2D' }}>⚠️ {driveError}</span>
            <button onClick={()=>setDriveError(null)} style={{ border:'none', background:'none', cursor:'pointer', color:'#A32D2D', fontSize:18 }}>✕</button>
          </div>
        )}
        {!CLIENT_ID && (
          <div style={{ background:'var(--yellow-l)', border:'1.5px solid #FFE082', borderRadius:12, padding:'10px 13px', marginBottom:12 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--yellow-d)' }}>⚠️ <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> não configurado — Drive desativado.</span>
          </div>
        )}

        {/* Stats: 2 colunas mobile / 4 colunas desktop */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 12 : 18 }}>
          <StatCard icon={<UserGroupIcon style={{ width:20,height:20 }} />}           value={criancas.length}                       label="Crianças"    color="var(--pink)"   />
          <StatCard icon={<ChartBarIcon  style={{ width:20,height:20 }} />}           value={`${freqGlobal}%`}                      label="Freq. geral" color="var(--blue)"   />
          <StatCard icon={<CheckCircleIcon style={{ width:20,height:20 }} />}         value={ranking.filter(c=>c.pct===100).length} label="Freq. plena" color="var(--green)"  />
          <StatCard icon={<ExclamationTriangleIcon style={{ width:20,height:20 }} />} value={alertas.length}                        label="Alertas"     color="var(--orange)" />
        </div>

        {/* Frequência + Ranking: lado a lado no desktop / empilhados no mobile */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 14, marginBottom: isMobile ? 12 : 14 }}>

          {/* Freq por turma */}
          <Card style={{ overflow:'hidden' }}>
            <CardHeader title="Frequência por turma" />
            <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>
              {TURMAS_ORDER.map(tid => {
                const t=TURMA_CONFIG[tid]; const pct=freqTurma(tid)
                if (pct===null) return null
                return (
                  <div key={tid}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:800 }}>{TURMA_EMOJI[tid]} {t.label}</span>
                      <span style={{ fontSize:13, fontWeight:900, color:freqColor(pct) }}>{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color={freqColor(pct)} h={8} />
                  </div>
                )
              })}
              {TURMAS_ORDER.every(t => freqTurma(t)===null) && <Empty msg="Nenhuma chamada ainda" />}
            </div>
          </Card>

          {/* Ranking */}
          <Card style={{ overflow:'hidden' }}>
            <CardHeader title="🏆 Ranking de frequência" />
            {ranking.length===0 ? <Empty msg="Nenhuma chamada ainda" /> :
              <div style={{ maxHeight: isMobile ? 220 : 260, overflowY:'auto' }}>
                {ranking.map((c,i) => {
                  const t=TURMA_CONFIG[c.turma]
                  return (
                    <div key={c.id} onClick={()=>router.push(`/criancas/${c.id}`)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderBottom:'1px solid rgba(240,98,146,0.07)', cursor:'pointer', minHeight:44 }}
                      onMouseOver={e=>(e.currentTarget.style.background='#FFF8F9')}
                      onMouseOut={e=>(e.currentTarget.style.background='')}>
                      <span style={{ fontSize:11, fontWeight:900, color:i<3?'var(--pink)':'#CBD5E1', minWidth:24, flexShrink:0 }}>#{i+1}</span>
                      <div style={{ width:30, height:30, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', fontWeight:900, background:t.light, color:t.color, fontSize:11 }}>
                        {c.foto_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img alt={c.nome} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                          : c.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}
                      </div>
                      <span style={{ fontSize:12, fontWeight:800, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</span>
                      <span style={{ fontSize:13, fontWeight:900, color:freqColor(c.pct), flexShrink:0 }}>{c.pct}%</span>
                    </div>
                  )
                })}
              </div>
            }
          </Card>
        </div>

        {/* Exportações: 2×2 no desktop / 1 coluna no mobile */}
        <Card style={{ overflow:'hidden' }}>
          <CardHeader title={
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <ArrowDownTrayIcon style={{ width:14,height:14 }} /> Exportar relatórios
            </span>
          } />
          <div style={{ padding: isMobile ? 12 : 14, display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 10 }}>
            {exportacoes.map(e => (
              <div key={e.tipo} style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
                {/* Info */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:e.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <ArrowDownTrayIcon style={{ width:17,height:17,color:e.color }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:900, color:'var(--text)' }}>{e.titulo}</div>
                    <div style={{ fontSize:11, color:'var(--sub)', fontWeight:600, marginTop:1 }}>{e.sub}</div>
                  </div>
                </div>

                {/* Botões */}
                <div style={{ display:'flex', borderTop:'1.5px solid var(--border)' }}>
                  <a href={`/api/exportar/${e.tipo}`} target="_blank" rel="noreferrer" style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                    padding: isMobile ? '13px 10px' : '10px',
                    textDecoration:'none', fontSize:12, fontWeight:800, color:'#64748B',
                    borderRight:'1px solid var(--border)', minHeight: isMobile ? 46 : 38,
                  }}
                    onMouseOver={ev=>(ev.currentTarget.style.background='#F8FAFC')}
                    onMouseOut={ev=>(ev.currentTarget.style.background='')}>
                    <ArrowDownTrayIcon style={{ width:13,height:13 }} /> Baixar
                  </a>

                  {savedLinks[e.tipo] ? (
                    <a href={savedLinks[e.tipo]} target="_blank" rel="noreferrer" style={{
                      flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                      padding: isMobile ? '13px 10px' : '10px',
                      textDecoration:'none', fontSize:12, fontWeight:800,
                      color:'var(--green-d)', background:'var(--green-l)',
                      minHeight: isMobile ? 46 : 38,
                    }}>
                      <CheckCircleIcon style={{ width:13,height:13 }} /> Abrir no Drive
                    </a>
                  ) : (
                    <button onClick={()=>handleDrive(e.tipo)} disabled={salvando===e.tipo || !CLIENT_ID} style={{
                      flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                      padding: isMobile ? '13px 10px' : '10px',
                      border:'none', cursor:(salvando===e.tipo||!CLIENT_ID)?'not-allowed':'pointer',
                      background:'transparent', fontSize:12, fontWeight:800,
                      color:salvando===e.tipo?'#94A3B8':'var(--blue-d)',
                      fontFamily:"'Nunito',sans-serif", opacity:!CLIENT_ID?0.4:1,
                      minHeight: isMobile ? 46 : 38,
                    }}
                      onMouseOver={ev=>{ if(salvando!==e.tipo&&CLIENT_ID) ev.currentTarget.style.background='#F8FAFC' }}
                      onMouseOut={ev=>(ev.currentTarget.style.background='')}>
                      {salvando===e.tipo
                        ? <><ArrowPathIcon style={{ width:13,height:13,animation:'spin 0.7s linear infinite' }} /> Salvando...</>
                        : <><CloudArrowUpIcon style={{ width:13,height:13 }} /> Drive</>
                      }
                    </button>
                  )}
                </div>

                {savedLinks[e.tipo] && (
                  <div style={{ padding:'8px 14px', background:'var(--green-l)', borderTop:'1px solid #9FE1CB' }}>
                    <span style={{ fontSize:11, color:'var(--green-d)', fontWeight:700 }}>
                      ✓ Salvo em Infância / {new Date().getFullYear()} —{' '}
                      <a href={savedLinks[e.tipo]} target="_blank" rel="noreferrer" style={{ color:'var(--green-d)' }}>abrir</a>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}