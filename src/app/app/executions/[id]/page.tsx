import { ExecutionDetail } from '@/components/execution-detail/ExecutionDetail'

export default async function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ExecutionDetail id={id} />
}
