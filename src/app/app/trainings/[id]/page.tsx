import { TrainingDetail } from '@/components/trainings/TrainingDetail'

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TrainingDetail id={id} />
}
