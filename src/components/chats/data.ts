// Mock data copiado do untitled.pen (frame "itera.ai App – Chat (Inbox)").
export type TagTone = 'success' | 'info' | 'error' | 'warning'
export type Conversation = {
  id: number
  when: string
  preview: string
  status?: 'success' | 'warning'
  unread?: number
  processing?: boolean
  tag?: { label: string; tone: TagTone }
  up?: number
  down?: number
}

export const conversations: Conversation[] = [
  { id: 42, when: 'agora', preview: 'Processando resposta…', status: 'success', processing: true, tag: { label: 'Demo', tone: 'success' }, up: 1, down: 1 },
  { id: 41, when: '12 min', preview: 'Agente: Temos integração nativa…', status: 'warning', unread: 2, tag: { label: 'Integração', tone: 'info' }, up: 1 },
  { id: 40, when: '25 min', preview: 'Cliente: Quero cancelar minha…', status: 'warning', unread: 1, tag: { label: 'Churn', tone: 'error' }, down: 1 },
  { id: 39, when: '1 h', preview: 'Agente: Pra ONGs temos 30% off', up: 2 },
  { id: 38, when: '2 h', preview: 'Agente: Enviei o contrato ✅', tag: { label: 'Fechamento', tone: 'success' } },
  { id: 37, when: '3 h', preview: 'Agente: SLA de 4h úteis no Team', up: 3 },
  { id: 36, when: 'ontem', preview: 'Cliente: Achei caro pra gente', tag: { label: 'Objeção', tone: 'warning' }, up: 1 },
  { id: 35, when: 'ontem', preview: 'Agente: Posso te mostrar um…', up: 2 },
  { id: 34, when: '2 dias', preview: 'Cliente: Falo com meu sócio', up: 1 },
]

export const tagToneClass: Record<TagTone, string> = {
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  error: 'bg-error-soft text-error',
  warning: 'bg-warning-soft text-warning',
}

export type Message =
  | { from: 'cliente'; text: string; time: string }
  | { from: 'agente'; text: string; time: string; exec: string; vote?: 'up' | 'down' }

export const messages: Message[] = [
  { from: 'cliente', text: 'Oi, vi o anúncio de vocês. Quanto custa pra 10 usuários?', time: '14:02' },
  { from: 'agente', text: 'Oi! 👋 O plano Team sai por R$ 49 por usuário/mês — pra 10 pessoas fica R$ 490/mês. Hoje vocês usam alguma ferramenta pra isso?', time: '14:02', exec: 'ex_8f2a1c · 1.8s · 2 tools', vote: 'up' },
  { from: 'cliente', text: 'Usamos planilha mesmo. Dá pra testar antes?', time: '14:03' },
  { from: 'agente', text: 'Dá sim! São 14 dias grátis, sem cartão. Quer que eu já agende uma demo de 20 min com o time pra te mostrar a migração da planilha?', time: '14:03', exec: 'ex_91bd07 · 1.2s · 1 tool', vote: 'down' },
  { from: 'cliente', text: 'Pode ser quinta à tarde', time: '14:04' },
]

export const executions = [
  { tool: 'calendar.find_slots', id: 'exec_8f21', time: '…', status: 'warning' as const },
  { tool: 'pricing.lookup', id: 'exec_8f1c', time: '1,2 s', status: 'success' as const },
  { tool: 'crm.get_lead', id: 'exec_8f0a', time: '0,8 s', status: 'success' as const },
]

export const sessionRows: { key: string; value: string; className?: string }[] = [
  { key: 'Status', value: '● Ativa', className: 'text-success' },
  { key: 'Agente', value: 'SDR · v3' },
  { key: 'Modelo', value: 'gpt-4.1', className: 'font-mono' },
  { key: 'Iniciada', value: 'Hoje, 14:02' },
  { key: 'Tokens', value: '3.412', className: 'font-mono' },
  { key: 'Custo', value: 'US$ 0,021', className: 'font-mono' },
]
