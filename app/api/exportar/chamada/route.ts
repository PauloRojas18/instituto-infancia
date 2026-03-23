import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import ExcelJS from 'exceljs'

type Crianca = {
  id: number
  nome: string
  turma: string
}

type Presenca = {
  crianca_id: number
  presente: boolean
}

type Chamada = {
  id: number
  turma: string
  data: string
  presencas_turma: Presenca[]
}

const SHEETS = [
  { id:'nivel1',  sheetName:'NÍVEL1',       label:'Nível 1 (Berçário, Maternal e Jardim)', evangelizadora:'Laryssa, Vilandia, Sthefanny', turmas:['maternal','jardim'], mergeA1B1:false, evangColEnd:6, turmaColStart:7 },
  { id:'nivel2a', sheetName:'6,7 e 8 ANOS', label:'Nível 2 (Intermediário) 7 e 8 anos',    evangelizadora:'Lindinalva',                   turmas:['nivel2a'],          mergeA1B1:true,  evangColEnd:7, turmaColStart:8 },
  { id:'nivel2b', sheetName:'NÍVEL 2',       label:'Nível 2 (9, 10 e 11 anos)',             evangelizadora:'Francielly',                    turmas:['nivel2b'],          mergeA1B1:true,  evangColEnd:7, turmaColStart:8 },
]

function colLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

const YELLOW   = { type:'pattern' as const, pattern:'solid' as const, fgColor:{ argb:'FFFFFFCC' } }
const THIN     = { style:'thin' as const }
const ALL_BRD  = { top:THIN, bottom:THIN, left:THIN, right:THIN }
const CENTER   = { horizontal:'center' as const }
const LEFT_AL  = { horizontal:'left'   as const }
const RIGHT_AL = { horizontal:'right'  as const }

export async function GET() {

  const { data: criancas } = await supabase
    .from('criancas')
    .select('*')
    .order('nome')

  const { data: chamadas } = await supabase
    .from('chamadas')
    .select('id, turma, data, presencas_turma(crianca_id, presente)')
    .order('data')

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Infância'

  for (const sheet of SHEETS) {

    const ws = wb.addWorksheet(sheet.sheetName)

    const alunos = (criancas ?? []).filter(
      (c: Crianca) => sheet.turmas.includes(c.turma)
    )

    const chamsSheet = (chamadas ?? []).filter(
      (c: Chamada) => sheet.turmas.includes(c.turma)
    )

    const datasSet = new Set(
      chamsSheet.map((c: Chamada) => c.data)
    )

    const datas = Array.from(datasSet).sort()

    const datasFmt = datas.map((d: string) => {
      const [,m,day] = d.split('-')
      return `${day}/${m}`
    })

    const nd = datas.length

    const lastColIdx = Math.max(2 + nd, 22)
    const lastRef = colLetter(lastColIdx)
    const evangRef = colLetter(sheet.evangColEnd)

    ws.getColumn(1).width = 4.5
    ws.getColumn(2).width = 44

    for (let i = 0; i < Math.max(nd,20); i++) {
      ws.getColumn(3+i).width = 8.5
    }

    if (sheet.mergeA1B1) ws.mergeCells('A1:B1')
    ws.mergeCells(`C1:${lastRef}3`)

    const r1a = ws.getCell('A1')
    r1a.value = 'ESCOLA DE EVANGELIZAÇÃO ESPÍRITA'
    r1a.font = { name:'Arial', bold:true, size:12 }
    r1a.fill = YELLOW
    r1a.alignment = CENTER

    const r1c = ws.getCell('C1')
    r1c.value = 'CHAMADA 2026 - 1º SEMESTRE'
    r1c.font = { name:'Arial', bold:true, size:12 }
    r1c.fill = YELLOW
    r1c.alignment = CENTER

    const r2b = ws.getCell(2,2)
    r2b.value = 'INFANTIL ANÁLIA FRANCO'
    r2b.font = { name:'Arial', bold:true, size:12 }
    r2b.fill = YELLOW
    r2b.alignment = RIGHT_AL

    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= 2; c++) {
        ws.getCell(r,c).fill = YELLOW
      }
    }

    ws.mergeCells(`A4:${evangRef}4`)
    ws.mergeCells(`${colLetter(sheet.turmaColStart)}4:${lastRef}4`)

    const r4a = ws.getCell('A4')
    r4a.value = `Evangelizadora: ${sheet.evangelizadora}`
    r4a.font = { name:'Arial', size:12 }
    r4a.fill = YELLOW
    r4a.alignment = LEFT_AL

    const r4t = ws.getCell(4, sheet.turmaColStart)
    r4t.value = `Turma: ${sheet.label}`
    r4t.font = { name:'Arial', size:12 }
    r4t.fill = YELLOW
    r4t.alignment = LEFT_AL

    ws.getRow(5).height = 30

    const h5n = ws.getCell('A5')
    h5n.value = 'Nº'
    h5n.font = { name:'Arial', bold:true, size:12 }
    h5n.alignment = CENTER
    h5n.border = ALL_BRD

    const h5nome = ws.getCell('B5')
    h5nome.value = 'Nome do Aluno'
    h5nome.font = { name:'Arial', bold:true, size:12 }
    h5nome.alignment = CENTER
    h5nome.border = ALL_BRD

    for (let i = 0; i < nd; i++) {
      const c = ws.getCell(5, 3+i)
      c.value = datasFmt[i]
      c.font = { name:'Arial', bold:true, size:12 }
      c.alignment = CENTER
      c.border = ALL_BRD
    }

    const presMap: Record<number, Record<string, boolean>> = {}

    for (const ch of chamsSheet) {
      for (const p of (ch.presencas_turma ?? [])) {

        if (!presMap[p.crianca_id]) {
          presMap[p.crianca_id] = {}
        }

        presMap[p.crianca_id][ch.data] = p.presente
      }
    }

    for (let idx = 0; idx < Math.max(alunos.length,15); idx++) {

      const row = 6 + idx
      const aluno: Crianca | null = alunos[idx] ?? null

      ws.getRow(row).height = 15.75

      const cNum = ws.getCell(row,1)

      if (aluno) {
        cNum.value = idx + 1
        cNum.font = { name:'Arial', bold:true, size:12, color:{ argb:'FF548135' } }
      }

      cNum.alignment = CENTER
      cNum.border = ALL_BRD

      const cNome = ws.getCell(row,2)

      if (aluno) {
        cNome.value = aluno.nome.toUpperCase()
        cNome.font = { name:'Arial', size:11 }
      }

      cNome.alignment = LEFT_AL
      cNome.border = ALL_BRD

      for (let i = 0; i < nd; i++) {

        const c = ws.getCell(row, 3+i)

        c.alignment = CENTER
        c.border = ALL_BRD

        if (aluno) {

          const pres = presMap[aluno.id]?.[datas[i]]

          if (pres === true) {
            c.value = 'P'
            c.font = { name:'Arial', bold:true, size:11, color:{ argb:'FF2E7D32' } }
            c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFE8F5E9' } }
          }

          if (pres === false) {
            c.value = 'F'
            c.font = { name:'Arial', bold:true, size:11, color:{ argb:'FFC62828' } }
            c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFCE4EC' } }
          }
        }
      }
    }

    ws.getRow(1).height = 20
    ws.getRow(2).height = 18
    ws.getRow(3).height = 8
    ws.getRow(4).height = 18
  }

  const buf = await wb.xlsx.writeBuffer()

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="chamada_infancia.xlsx"',
    },
  })
}