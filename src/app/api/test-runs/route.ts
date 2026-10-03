// Runs a version's test suite (and the baseline's, if provided) on demand.
import { after } from 'next/server'
import { db, must } from '@/lib/server/db'
import { runTests } from '@/lib/server/run-test'

export const maxDuration = 800

export async function POST(req: Request) {
  const { versionId, baselineId, jobId } = (await req.json()) as { versionId: string; baselineId?: string | null; jobId?: string | null }
  if (!versionId) return Response.json({ error: 'versionId is required' }, { status: 400 })

  const version = must(await db.from('prompt_versions').select('agent_id').eq('id', versionId).single(), 'version')
  const cases = must(
    await db.from('test_cases').select('id').eq('agent_id', version.agent_id).order('created_at', { ascending: false }).limit(6),
    'test cases',
  )
  if (!cases.length) {
    return Response.json({ error: 'This agent has no test cases yet. Create them under Agents → Test suite.' }, { status: 400 })
  }

  const runs = must(
    await db
      .from('test_runs')
      .insert(
        cases.flatMap((c) => [
          { test_case_id: c.id, prompt_version_id: versionId, variant: 'candidate', job_id: jobId ?? null },
          ...(baselineId ? [{ test_case_id: c.id, prompt_version_id: baselineId, variant: 'baseline', job_id: jobId ?? null }] : []),
        ]),
      )
      .select('id'),
    'test runs',
  )

  after(() => runTests(runs.map((r) => r.id), jobId ?? null))
  return Response.json({ runIds: runs.map((r) => r.id) }, { status: 202 })
}
