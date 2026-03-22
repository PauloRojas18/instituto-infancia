export function initials(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  const wd    = new Date(+y, +m - 1, +day).getDay()
  const days  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${days[wd]}, ${day} ${meses[+m - 1]}`
}

export function formatDateLong(d: string) {
  const [y, m, day] = d.split('-')
  const wd    = new Date(+y, +m - 1, +day).getDay()
  const days  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${days[wd]}, ${day} de ${meses[+m - 1]}`
}

export function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function freqColor(pct: number | null) {
  if (pct === null) return '#94A3B8'
  return pct >= 75 ? '#2E7D32' : '#E24B4A'
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}