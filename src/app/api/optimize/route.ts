// Self-improvement queue: creates the job and processes it in the background (reflection + test suite).
import { after } from 'next/server'
import { db, must } from '@/lib/server/db'
import { runOptimization } from '@/lib/server/optimize'

// Reflection + test suite run after the response, within this route's limit.
export const maxDuration = 800

export async function POST(req: Request) {
  const { agentId, feedbackIds } = (await req.json()) as { agentId: string; feedbackIds: string[] }
  if (!agentId || !feedbackIds?.length) return Response.json({ error: 'agentId and feedbackIds are required' }, { status: 400 })

  const agent = must(await db.from('agents').select('id, production_version_id').eq('id', agentId).single(), 'agent')
  if (!agent.production_version_id) return Response.json({ error: 'Agent has no production version' }, { status: 400 })

  const job = must(
    await db
      .from('optimization_jobs')
      .insert({ agent_id: agentId, base_version_id: agent.production_version_id, feedback_ids: feedbackIds, status: 'queued' })
      .select('id')
      .single(),
    'job',
  )
  await db.from('feedbacks').update({ status: 'processing', optimization_job_id: job.id }).in('id', feedbackIds)

  after(() =>
    runOptimization(job.id).catch(async (e) => {
      console.error(e)
      await db.from('optimization_jobs').update({ status: 'failed', error: String(e), finished_at: new Date().toISOString() }).eq('id', job.id)
      await db.from('feedbacks').update({ status: 'pending', optimization_job_id: null }).eq('optimization_job_id', job.id)
    }),
  )

  return Response.json({ jobId: job.id }, { status: 202 })
}
