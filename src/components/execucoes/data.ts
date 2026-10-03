export type ExecStatus = 'processando' | 'sucesso' | 'erro'
export type ExecFeedback = 'positivo' | 'negativo' | null

export type Execucao = {
  id: string
  mensagem: string
  autor: string
  chat: string
  status: ExecStatus
  tools: string
  duracao: string
  quando: string
  feedback: ExecFeedback
}

// Mock copiado exatamente do untitled.pen (frame "itera.ai App – Execuções").
export const execucoes: Execucao[] = [
  { id: 'ex_a03f5e', mensagem: 'Pode ser quinta à tarde', autor: 'Lead (teste)', chat: 'Sessão #42', status: 'processando', tools: '1', duracao: '—', quando: 'agora', feedback: null },
  { id: 'ex_91bd07', mensagem: 'Usamos planilha mesmo. Dá pra testar antes?', autor: 'Lead (teste)', chat: 'Sessão #42', status: 'sucesso', tools: '1', duracao: '1.2s', quando: '1 min', feedback: 'negativo' },
  { id: 'ex_8f2a1c', mensagem: 'Oi, vi o anúncio de vocês. Quanto custa pra 10 usuários?', autor: 'Lead (teste)', chat: 'Sessão #42', status: 'sucesso', tools: '2', duracao: '1.8s', quando: '2 min', feedback: 'positivo' },
  { id: 'ex_77e410', mensagem: 'Vocês integram com o HubSpot?', autor: 'Lead (teste)', chat: 'Sessão #41', status: 'erro', tools: '3', duracao: '8.4s', quando: '12 min', feedback: 'negativo' },
  { id: 'ex_5c19aa', mensagem: 'Quero cancelar minha assinatura', autor: 'Lead (teste)', chat: 'Sessão #40', status: 'sucesso', tools: '0', duracao: '0.9s', quando: '25 min', feedback: 'negativo' },
  { id: 'ex_4b0d21', mensagem: 'Tem desconto pra ONG?', autor: 'Lead (teste)', chat: 'Sessão #39', status: 'sucesso', tools: '1', duracao: '1.4s', quando: '1 h', feedback: 'positivo' },
  { id: 'ex_3e88f0', mensagem: 'Me manda o contrato por email', autor: 'Lead (teste)', chat: 'Sessão #38', status: 'sucesso', tools: '2', duracao: '2.1s', quando: '2 h', feedback: null },
]

export const tabs = [
  { key: 'todas', label: 'Todas · 312' },
  { key: 'sucesso', label: 'Sucesso' },
  { key: 'erro', label: 'Com erro · 6' },
  { key: 'sem-feedback', label: 'Sem feedback · 241' },
  { key: 'positivos', label: 'Positivos · 58' },
  { key: 'negativos', label: 'Negativos · 13' },
] as const

export type TabKey = (typeof tabs)[number]['key']

export function filterExecucoes(tab: TabKey) {
  switch (tab) {
    case 'sucesso': return execucoes.filter((e) => e.status === 'sucesso')
    case 'erro': return execucoes.filter((e) => e.status === 'erro')
    case 'sem-feedback': return execucoes.filter((e) => e.feedback === null)
    case 'positivos': return execucoes.filter((e) => e.feedback === 'positivo')
    case 'negativos': return execucoes.filter((e) => e.feedback === 'negativo')
    default: return execucoes
  }
}
