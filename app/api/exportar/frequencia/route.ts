import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import ExcelJS from 'exceljs'
import { TURMA_CONFIG } from '@/types'

type Crianca = {
  id: number
  nome: string
  turma: string
  responsavel: string
  telefone: string
}

type Presenca = {
  crianca_id: number
  presente: boolean
}

export async function GET() {

  const { data: criancas } = await supabase
    .from('criancas')
    .select('*')
    .order('nome')

  const { data: pt } = await supabase
    .from('presencas_turma')
    .select('crianca_id, presente')

  const { data: pg } = await supabase
    .from('presencas_gerais')
    .select('crianca_id, presente')

  const map: Record<number, { total:number; presentes:number }> = {}

  const add = (rows: Presenca[] | null) => {
    rows?.forEach(r => {
      if (!map[r.crianca_id]) {
        map[r.crianca_id] = { total:0, presentes:0 }
      }

      map[r.crianca_id].total++

      if (r.presente) {
        map[r.crianca_id].presentes++
      }
    })
  }

  add(pt as Presenca[])
  add(pg as Presenca[])

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Infância'

  const ws = wb.addWorksheet('Frequência')

  ws.columns = [
    { header:'Nome',       key:'nome',       width:30 },
    { header:'Turma',      key:'turma',      width:22 },
    { header:'Responsável',key:'responsavel',width:26 },
    { header:'Telefone',   key:'telefone',   width:18 },
    { header:'Presenças',  key:'presentes',  width:12 },
    { header:'Total',      key:'total',      width:10 },
    { header:'Frequência', key:'freq',       width:12 },
    { header:'Situação',   key:'situacao',   width:14 },
  ]

  ws.getRow(1).eachCell(cell => {
    cell.font = { bold:true, color:{ argb:'FFFFFFFF' } }

    cell.fill = {
      type:'pattern',
      pattern:'solid',
      fgColor:{ argb:'FFF06292' }
    }

    cell.alignment = {
      vertical:'middle',
      horizontal:'center'
    }
  })

  ws.getRow(1).height = 22

  criancas?.forEach((c: Crianca) => {

    const f = map[c.id] ?? { total:0, presentes:0 }

    const pct =
      f.total > 0
        ? Math.round((f.presentes / f.total) * 100)
        : null

    const t = TURMA_CONFIG[c.turma as keyof typeof TURMA_CONFIG]

    const row = ws.addRow({
      nome: c.nome,
      turma: t?.label ?? c.turma,
      responsavel: c.responsavel,
      telefone: c.telefone,
      presentes: f.presentes,
      total: f.total,
      freq: pct !== null ? `${pct}%` : '—',
      situacao:
        pct === null
          ? '—'
          : pct >= 75
          ? '✓ Regular'
          : '⚠ Atenção',
    })

    if (pct !== null && pct < 75) {
      row.getCell('freq').font = {
        bold:true,
        color:{ argb:'FFE24B4A' }
      }

      row.getCell('situacao').font = {
        bold:true,
        color:{ argb:'FFE24B4A' }
      }
    }
  })

  ws.autoFilter = { from:'A1', to:'H1' }

  const buf = await wb.xlsx.writeBuffer()

  return new NextResponse(buf, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="frequencia_infancia.xlsx"',
    },
  })
}