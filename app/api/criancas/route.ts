import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('criancas').select('*').order('nome')
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { nome, responsavel, telefone, endereco, turma, foto_url, obs } = body
  if (!nome?.trim() || !responsavel?.trim() || !turma)
    return NextResponse.json({ error:'nome, responsavel e turma são obrigatórios' }, { status:400 })
  const { data, error } = await supabase.from('criancas')
    .insert({ nome:nome.trim(), responsavel:responsavel.trim(), telefone:telefone||'', endereco:endereco||'', turma, foto_url:foto_url||null, obs:obs||null })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json(data, { status:201 })
}