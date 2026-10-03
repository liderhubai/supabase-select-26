import { ExecucaoDetalhe } from '@/components/execucao-detalhe/ExecucaoDetalhe'

// Rota /app/execucoes/[id] — qualquer id renderiza a mesma execução mock (ex_91bd07).
export default async function ExecucaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await params
  return <ExecucaoDetalhe />
}
