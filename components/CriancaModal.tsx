'use client'
// components/CriancaModal.tsx
import { useState, useRef } from 'react'
import { Crianca, TURMA_CONFIG, TURMAS_ORDER, Turma } from '@/types'
import { Modal, Field, Input, Select, Textarea, Btn } from './ui'
import { PhotoIcon } from '@heroicons/react/24/outline'

interface Props {
  initial?: Crianca | null
  onClose:  () => void
  onSaved:  (c: Crianca) => void
}

export default function CriancaModal({ initial, onClose, onSaved }: Props) {
  const isEdit = !!initial
  const [nome,        setNome]        = useState(initial?.nome        ?? '')
  const [responsavel, setResponsavel] = useState(initial?.responsavel ?? '')
  const [telefone,    setTelefone]    = useState(initial?.telefone    ?? '')
  const [endereco,    setEndereco]    = useState(initial?.endereco    ?? '')
  const [turma,       setTurma]       = useState<Turma>(initial?.turma ?? 'maternal')
  const [obs,         setObs]         = useState(initial?.obs         ?? '')
  const [fotoFile,    setFotoFile]    = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string>(initial?.foto_url ?? '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFotoFile(f)
    setFotoPreview(URL.createObjectURL(f))
  }

  const uploadFoto = async (criancaId: number): Promise<string | null> => {
    if (!fotoFile) return initial?.foto_url ?? null
    const { supabase } = await import('@/lib/supabase')
    const ext  = fotoFile.name.split('.').pop() ?? 'jpg'
    const path = `crianca-${criancaId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('fotos')
      .upload(path, fotoFile, { upsert: true })
    if (uploadError) return null
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    return data.publicUrl
  }

  const salvar = async () => {
    if (!nome.trim() || !responsavel.trim()) {
      setError('Nome e responsável são obrigatórios')
      return
    }
    setSaving(true); setError('')
    try {
      const method = isEdit ? 'PATCH' : 'POST'
      const url    = isEdit ? `/api/criancas/${initial!.id}` : '/api/criancas'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(), responsavel: responsavel.trim(),
          telefone, endereco, turma,
          obs: obs || null,
          foto_url: initial?.foto_url ?? null,
        }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Erro ao salvar')
      }
      const saved = await res.json() as Crianca

      if (fotoFile) {
        const fotoUrl = await uploadFoto(saved.id)
        if (fotoUrl) {
          const r2 = await fetch(`/api/criancas/${saved.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foto_url: fotoUrl }),
          })
          if (r2.ok) {
            const updated = await r2.json() as Crianca
            onSaved(updated); onClose(); return
          }
        }
      }
      onSaved(saved); onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? '✏️ Editar criança' : '👶 Nova criança'}
      sub={isEdit ? 'Atualize os dados abaixo' : 'Preencha os dados para cadastrar'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={salvar} disabled={saving}>
          {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar criança'}
        </Btn>
      </>}
    >
      {error && (
        <div style={{ background:'#FCEBEB', color:'#A32D2D', borderRadius:10, padding:'10px 13px', fontSize:12, fontWeight:700 }}>
          {error}
        </div>
      )}

      {/* Foto */}
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div
          onClick={()=>inputRef.current?.click()}
          style={{ width:84, height:84, borderRadius:18, border:'2.5px dashed var(--pink)', background:'var(--pink-l)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', flexShrink:0 }}
        >
          {fotoPreview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={fotoPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <>
                <PhotoIcon style={{ width:28, height:28, color:'var(--pink)' }} />
                <span style={{ fontSize:10, fontWeight:800, color:'var(--pink)', marginTop:4 }}>Foto</span>
              </>
          }
          <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFoto} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:800, color:'var(--text)' }}>Foto da criança</div>
          <div style={{ fontSize:11, color:'var(--sub)', marginTop:3, lineHeight:1.5 }}>
            Clique para selecionar<br />(opcional)
          </div>
        </div>
      </div>

      <Field label="Nome completo" required>
        <Input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Ana Beatriz Silva" autoFocus />
      </Field>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Responsável" required>
          <Input value={responsavel} onChange={e=>setResponsavel(e.target.value)} placeholder="Ex: João Silva" />
        </Field>
        <Field label="Telefone">
          <Input value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="(67) 9 9999-0000" />
        </Field>
      </div>

      <Field label="Endereço">
        <Input value={endereco} onChange={e=>setEndereco(e.target.value)} placeholder="Rua, número, bairro..." />
      </Field>

      <Field label="Turma" required>
        <Select value={turma} onChange={e=>setTurma(e.target.value as Turma)}>
          {TURMAS_ORDER.map(id => (
            <option key={id} value={id}>{TURMA_CONFIG[id].label} — {TURMA_CONFIG[id].faixa}</option>
          ))}
        </Select>
      </Field>

      <Field label="Observações">
        <Textarea value={obs} onChange={e=>setObs(e.target.value)} rows={2} placeholder="Alergias, necessidades especiais..." />
      </Field>
    </Modal>
  )
}