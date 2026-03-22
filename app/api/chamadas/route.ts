import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const turma = new URL(req.url).searchParams.get('turma')
  let q = supabase.from('chamadas').select('*, presencas_turma(crianca_id, presente)').order('data', { ascending:false })
  if (turma) q = q.eq('turma', turma)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { turma, data: date, presencas } = await req.json()
  if (!turma || !date) return NextResponse.json({ error:'turma e data obrigatórios' }, { status:400 })

  const { data: ch, error: e1 } = await supabase.from('chamadas')
    .upsert({ turma, data: date }, { onConflict:'turma,data' }).select().single()
  if (e1) return NextResponse.json({ error: e1.message }, { status:500 })

  if (Array.isArray(presencas) && presencas.length > 0) {
    const rows = presencas.map((p: { criancaId:number; presente:boolean }) => ({ chamada_id:ch.id, crianca_id:p.criancaId, presente:p.presente }))
    const { error: e2 } = await supabase.from('presencas_turma').upsert(rows, { onConflict:'chamada_id,crianca_id' })
    if (e2) return NextResponse.json({ error: e2.message }, { status:500 })
  }
  return NextResponse.json({ ok:true, chamadaId:ch.id }, { status:201 })
}