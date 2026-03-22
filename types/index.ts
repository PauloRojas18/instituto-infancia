export type Turma = 'maternal' | 'jardim' | 'nivel2a' | 'nivel2b'

export interface Crianca {
  id:          number
  nome:        string
  responsavel: string
  telefone:    string
  endereco:    string
  turma:       Turma
  foto_url:    string | null
  obs:         string | null
  created_at?: string
}

export interface FreqResumo {
  crianca_id: number
  total:      number
  presentes:  number
  pct:        number
}

export interface HistoricoItem {
  data:     string
  presente: boolean
  tipo:     'turma' | 'geral'
  turma:    Turma | null
}

export const TURMA_CONFIG = {
  maternal: { label: 'Maternal',            faixa: 'Até 3 anos',  color: '#F06292', light: '#FCE4EC', text: '#C2185B' },
  jardim:   { label: 'Jardim',              faixa: '4 a 5 anos',  color: '#66BB6A', light: '#E8F5E9', text: '#2E7D32' },
  nivel2a:  { label: 'Nível 2 · 6, 7, 8',  faixa: '6 a 8 anos',  color: '#42A5F5', light: '#E3F2FD', text: '#1565C0' },
  nivel2b:  { label: 'Nível 2 · 9, 10, 11',faixa: '9 a 11 anos', color: '#AB47BC', light: '#F3E5F5', text: '#7B1FA2' },
} as const

export const TURMAS_ORDER: Turma[] = ['maternal', 'jardim', 'nivel2a', 'nivel2b']