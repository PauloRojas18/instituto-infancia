import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('chamadas_gerais')
    .select('*, presencas_gerais(crianca_id, presente)').order('data', { ascending:false })
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { data: date, presencas } = await req.json()
  if (!date) return NextResponse.json({ error:'data obrigatória' }, { status:400 })

  const { data: cg, error: e1 } = await supabase.from('chamadas_gerais')
    .upsert({ data: date }, { onConflict:'data' }).select().single()
  if (e1) return NextResponse.json({ error: e1.message }, { status:500 })

  if (Array.isArray(presencas) && presencas.length > 0) {
    await supabase.from('presencas_gerais').delete().eq('chamada_geral_id', cg.id)
    const rows = presencas.map((p: { criancaId:number; presente:boolean }) => ({ chamada_geral_id:cg.id, crianca_id:p.criancaId, presente:p.presente }))
    const { error: e2 } = await supabase.from('presencas_gerais').insert(rows)
    if (e2) return NextResponse.json({ error: e2.message }, { status:500 })
  }
  return NextResponse.json({ ok:true }, { status:201 })
}