// Mock data copiado do untitled.pen (frame "itera.ai App – Feedback").
export type Group = {
  id: string
  label: string
  count: string
  icon: 'inbox' | 'circle-dashed' | 'folder'
  color?: 'accent' | 'info' | 'success' | 'error' | 'warning'
}

export const groups: Group[] = [
  { id: 'todos', label: 'Todos', count: '71', icon: 'inbox' },
  { id: 'sem-grupo', label: 'Sem grupo', count: '9', icon: 'circle-dashed' },
  { id: 'objecoes', label: 'Objeções', count: '14', icon: 'folder', color: 'accent' },
  { id: 'precos', label: 'Preços', count: '18', icon: 'folder', color: 'info' },
  { id: 'agendamento', label: 'Agendamento', count: '11', icon: 'folder', color: 'success' },
  { id: 'cancelamento', label: 'Cancelamento', count: '8', icon: 'folder', color: 'error' },
  { id: 'integracoes', label: 'Integrações', count: '11', icon: 'folder', color: 'warning' },
]

export type Feedback = {
  id: string
  kind: 'positive' | 'negative'
  message: string
  reply: string
  comment?: string
  trained?: boolean
}

export const feedbacks: Feedback[] = [
  {
    id: 'ex_91bd07',
    kind: 'negative',
    message: 'Usamos planilha mesmo. Dá pra testar antes?',
    reply: 'Agente: Dá sim! São 14 dias grátis, sem cartão. Quer que eu já agende uma demo…',
    comment: 'Ofereceu demo cedo demais — devia explicar a importação da planilha primeiro.',
  },
  {
    id: 'ex_5c19aa',
    kind: 'negative',
    message: 'Quero cancelar minha assinatura',
    reply: 'Agente: Que pena! Posso te oferecer 30% de desconto pelos próximos 3 meses…',
    comment: 'Não pode oferecer desconto antes de entender o motivo do cancelamento.',
  },
  {
    id: 'ex_2f71b3',
    kind: 'positive',
    message: 'Achei caro pra gente agora',
    reply: 'Agente: Entendo! Muitos times começam com 5 licenças e expandem depois…',
    comment: 'Ótimo jeito de contornar preço sem dar desconto.',
  },
  {
    id: 'ex_77e410',
    kind: 'negative',
    message: 'Vocês integram com o HubSpot?',
    reply: 'Agente: Sim, temos integração nativa com o HubSpot desde…',
    comment: 'Inventou uma integração que não existe.',
  },
  {
    id: 'ex_0c9e51',
    kind: 'positive',
    message: 'Preciso falar com meu sócio antes',
    reply: 'Agente: Claro! Quer que eu te mande um resumo de 1 página pra mostrar pra ele?',
  },
  {
    id: 'ex_1d02c8',
    kind: 'positive',
    message: 'Já uso o concorrente X',
    reply: 'Agente: Faz sentido! A diferença principal pra quem vem do X é…',
    comment: 'Comparou sem falar mal do concorrente.',
    trained: true,
  },
]

export const initialSelected = ['ex_91bd07', 'ex_5c19aa', 'ex_2f71b3', 'ex_77e410', 'ex_0c9e51']

export const filters = ['Todos', '👍 Positivos', '👎 Negativos', 'Pendentes'] as const
