# 👶 Instituto Infância — Sistema de Chamada e Frequência

Sistema web desenvolvido para o **Instituto Infância**, focado no controle de frequência de crianças em turmas. Permite registrar chamadas por turma ou de forma geral, acompanhar o histórico de cada criança e exportar relatórios de frequência.

---

## ✨ Funcionalidades

- **Chamada por turma** — registro de presença agrupado por turma
- **Chamada geral** — visão consolidada de todas as crianças no dia
- **Perfil individual** — histórico completo de frequência por criança
- **Dashboard** — indicadores de frequência em tempo real
- **Relatórios** — exportação de chamadas e frequência para Excel
- **Exportação de dados** — download de chamadas e resumos de frequência

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 + React 18 |
| Linguagem | TypeScript |
| Banco de dados | Supabase (PostgreSQL) |
| UI Icons | Heroicons |
| Estilização | Tailwind CSS |
| Exportação | ExcelJS |
| Hospedagem | Vercel |

---

## 📁 Estrutura do Projeto

```
app/
├── (app)/
│   ├── dashboard/        # Indicadores gerais
│   ├── criancas/         # Listagem e perfil de cada criança
│   │   └── [id]/         # Histórico individual
│   ├── chamada-turma/    # Chamada por turma
│   ├── chamada-geral/    # Chamada consolidada
│   └── relatorios/       # Relatórios e exportação
└── api/
    ├── criancas/          # CRUD de crianças
    ├── chamadas/          # Registro de chamadas
    ├── chamadas-gerais/   # Chamadas do dia
    ├── freq-resumo/       # Resumo de frequência
    └── exportar/          # Rotas de exportação Excel
```

---

## 📚 Aprendizados

- Modelar e consultar dados de frequência no **Supabase** de forma eficiente, agrupando registros por turma e por data sem carregar dados desnecessários
- Gerar arquivos Excel dinamicamente no servidor com **ExcelJS**, formatando colunas, aplicando estilos e disponibilizando o download via API Route Handler
- Trabalhar com rotas dinâmicas `[id]` no Next.js para exibir o histórico individual de cada criança, mantendo a navegação fluida
- Separar responsabilidades entre chamada por turma e chamada geral, reaproveitando lógica de API entre os dois fluxos

---

## 👤 Autor

**Paulo Otávio Câmara Rojas**  
[GitHub](https://github.com/PauloRojas18) • [LinkedIn](https://linkedin.com/in/paulo-rojas-b7b77a3a1/) • paulootaviogalala@gmail.com
