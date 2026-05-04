// app/api/presencas/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Turma } from '@/types'

export async function GET(req: Request) {
  const criancaId = new URL(req.url).searchParams.get('criancaId')
  if (!criancaId) {
    return NextResponse.json({ error: 'criancaId obrigatório' }, { status: 400 })
  }

  const [{ data: pt, error: e1 }, { data: pg, error: e2 }] = await Promise.all([
    supabase
      .from('presencas_turma')
      .select('presente, chamadas(data, turma)')
      .eq('crianca_id', criancaId),
    supabase
      .from('presencas_gerais')
      .select('presente, chamadas_gerais(data)')
      .eq('crianca_id', criancaId),
  ])

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  // Normaliza: Supabase pode retornar objeto ou array dependendo da FK
  const toObj = <T>(val: T | T[] | null): T | null => {
    if (!val) return null
    return Array.isArray(val) ? val[0] ?? null : val
  }

  const historico = [
    ...(pt ?? []).flatMap(p => {
      const chamada = toObj(p.chamadas as { data: string; turma: Turma } | { data: string; turma: Turma }[] | null)
      if (!chamada?.data) return []
      return [{
        data:     chamada.data,
        presente: p.presente,
        tipo:     'turma' as const,
        turma:    chamada.turma,
      }]
    }),
    ...(pg ?? []).flatMap(p => {
      const chamadaGeral = toObj(p.chamadas_gerais as { data: string } | { data: string }[] | null)
      if (!chamadaGeral?.data) return []
      return [{
        data:     chamadaGeral.data,
        presente: p.presente,
        tipo:     'geral' as const,
        turma:    null,
      }]
    }),
  ]
    .filter(h => !!h.data)
    .sort((a, b) => b.data.localeCompare(a.data))

  const total     = historico.length
  const presentes = historico.filter(h => h.presente).length

  return NextResponse.json({
    historico,
    total,
    presentes,
    pct: total > 0 ? Math.round((presentes / total) * 100) : null,
  })
}