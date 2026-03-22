// app/api/freq-resumo/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface PresencaRow {
  crianca_id: number
  presente:   boolean
}

export async function GET() {
  const [{ data: pt }, { data: pg }] = await Promise.all([
    supabase.from('presencas_turma').select('crianca_id, presente'),
    supabase.from('presencas_gerais').select('crianca_id, presente'),
  ])

  const map: Record<number, { total: number; presentes: number }> = {}

  const add = (rows: PresencaRow[] | null) => {
    rows?.forEach(r => {
      if (!map[r.crianca_id]) map[r.crianca_id] = { total: 0, presentes: 0 }
      map[r.crianca_id].total++
      if (r.presente) map[r.crianca_id].presentes++
    })
  }

  add(pt as PresencaRow[] | null)
  add(pg as PresencaRow[] | null)

  return NextResponse.json(
    Object.entries(map).map(([id, v]) => ({
      crianca_id: Number(id),
      total:      v.total,
      presentes:  v.presentes,
      pct:        Math.round(v.presentes / v.total * 100),
    }))
  )
}