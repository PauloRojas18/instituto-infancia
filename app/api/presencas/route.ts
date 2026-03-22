// app/api/presencas/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Turma } from '@/types'

interface PresencaTurmaRow {
  presente: boolean
  chamadas: { data: string; turma: Turma } | null
}

interface PresencaGeralRow {
  presente: boolean
  chamadas_gerais: { data: string } | null
}

export async function GET(req: Request) {
  const criancaId = new URL(req.url).searchParams.get('criancaId')
  if (!criancaId) return NextResponse.json({ error: 'criancaId obrigatório' }, { status: 400 })

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

  const historico = [
    ...(pt as PresencaTurmaRow[] ?? []).map(p => ({
      data:     p.chamadas?.data     ?? '',
      presente: p.presente,
      tipo:     'turma' as const,
      turma:    p.chamadas?.turma    ?? null,
    })),
    ...(pg as PresencaGeralRow[] ?? []).map(p => ({
      data:     p.chamadas_gerais?.data ?? '',
      presente: p.presente,
      tipo:     'geral' as const,
      turma:    null,
    })),
  ]
    .filter(h => h.data)
    .sort((a, b) => b.data.localeCompare(a.data))

  const total     = historico.length
  const presentes = historico.filter(h => h.presente).length

  return NextResponse.json({
    historico,
    total,
    presentes,
    pct: total > 0 ? Math.round(presentes / total * 100) : null,
  })
}