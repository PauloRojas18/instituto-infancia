import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params:{ id:string } }) {
  const { data, error } = await supabase.from('criancas').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status:404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params:{ id:string } }) {
  const body = await req.json()
  const allowed = ['nome','responsavel','telefone','endereco','turma','foto_url','obs']
  const up: Record<string,unknown> = {}
  allowed.forEach(k => { if (k in body) up[k] = body[k] })
  const { data, error } = await supabase.from('criancas').update(up).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params:{ id:string } }) {
  const { error } = await supabase.from('criancas').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json({ ok:true })
}