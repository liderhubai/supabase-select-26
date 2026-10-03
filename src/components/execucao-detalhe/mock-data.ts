import { Brain, Coins, Cpu, History, Inbox, Layers, Send, Timer, Wrench, type LucideIcon } from 'lucide-react'

// Dados mock da tela "Execução (Detalhe)" — textos copiados exatamente do untitled.pen (frame XAKBW).
export const execucao = {
  id: 'ex_91bd07',
  status: 'Sucesso',
  sessao: 'Sessão #42',
  meta: [
    { icon: History, text: 'Hoje · 14:03:12.418' },
    { icon: Timer, text: '1.2s' },
    { icon: Wrench, text: '1 tool' },
    { icon: Coins, text: '1.240 tokens' },
    { icon: Cpu, text: 'gpt-4.1 · prompt v3' },
  ] satisfies { icon: LucideIcon; text: string }[],
  snapshot: {
    title: 'Snapshot da conversa',
    subtitle: 'Estado exato do chat às 14:03:12, quando a mensagem chegou',
    turno: 'turno 2 de 3',
    contexto: [
      { from: 'cliente' as const, text: 'Oi, vi o anúncio de vocês. Quanto custa pra 10 usuários?' },
      {
        from: 'agente' as const,
        text: 'Oi! 👋 O plano Team sai por R$ 49 por usuário/mês — pra 10 pessoas fica R$ 490/mês. Hoje vocês usam alguma ferramenta pra isso?',
      },
    ],
    recebida: { label: 'MENSAGEM RECEBIDA · 14:03:12', text: 'Usamos planilha mesmo. Dá pra testar antes?' },
    resposta: {
      label: 'RESPOSTA RETORNADA · +1.2s',
      text: 'Dá sim! São 14 dias grátis, sem cartão. Quer que eu já agende uma demo de 20 min com o time pra te mostrar a migração da planilha?',
    },
  },
  processamento: {
    title: 'O que o agente fez',
    subtitle: '5 etapas · 1.2s no total',
  },
}

export type Step = {
  icon: LucideIcon
  iconClass: string
  title: string
  mono?: boolean
  time: string
  desc: string
  code?: { in: string; out: string }
}

export const steps: Step[] = [
  {
    icon: Inbox,
    iconClass: 'text-info',
    title: 'Mensagem recebida',
    time: '+0ms',
    desc: '“Usamos planilha mesmo. Dá pra testar antes?”',
  },
  {
    icon: Layers,
    iconClass: 'text-muted-foreground',
    title: 'Contexto montado',
    time: '+38ms',
    desc: '2 mensagens anteriores · prompt v3 · memória do lead: 10 usuários, usa planilha',
  },
  {
    icon: Brain,
    iconClass: 'text-accent',
    title: 'Raciocínio',
    time: '+410ms',
    desc: 'Intenção: pedir teste grátis. Objeção leve de migração. Estratégia: confirmar o trial e puxar para uma demo.',
  },
  {
    icon: Wrench,
    iconClass: 'text-warning',
    title: 'Tool · knowledge.search',
    mono: true,
    time: '+520ms',
    desc: 'Buscou na base de conhecimento · 180ms',
    code: { in: '→ { "query": "período de teste" }', out: '← "Trial de 14 dias, sem cartão."' },
  },
  {
    icon: Send,
    iconClass: 'text-success',
    title: 'Resposta gerada',
    time: '+1.2s',
    desc: '96 tokens de saída · finish_reason: stop',
  },
]

export const gruposFeedback = ['Objeções', 'Preço', 'Tom de voz', 'Agendamento']
