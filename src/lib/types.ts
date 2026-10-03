export type VersionStatus = 'draft' | 'staging' | 'production' | 'archived' | 'rejected'

export interface Agent {
  id: string
  name: string
  kind: string
  description: string
  model: string
  production_version_id: string | null
  created_at: string
}

export interface PromptChange {
  title: string
  before: string
  after: string
  reason: string
  feedback_ids: string[]
}

export interface PromptVersion {
  id: string
  agent_id: string
  version: number
  system_prompt: string
  status: VersionStatus
  parent_version_id: string | null
  change_summary: string | null
  changes: PromptChange[]
  optimization_job_id: string | null
  created_at: string
  promoted_at: string | null
}

export interface Conversation {
  id: string
  agent_id: string
  prompt_version_id: string
  customer_label: string
  source: 'simulation' | 'test'
  created_at: string
}

export interface ConfidenceIssue {
  type: 'invented_fact' | 'policy_violation' | 'missing_confirmation' | 'wrong_answer' | 'off_topic' | 'tone' | 'unsafe'
  excerpt: string
  explanation: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  execution_id: string | null
  confidence: number | null
  confidence_reason: string | null
  confidence_issues: ConfidenceIssue[]
  created_at: string
}

export interface Execution {
  id: string
  conversation_id: string | null
  prompt_version_id: string | null
  kind: 'chat' | 'optimize' | 'test_user' | 'test_agent' | 'judge' | 'confidence'
  model: string
  input: { instructions: string; messages: { role: string; content: string }[] }
  output: string | null
  input_tokens: number | null
  output_tokens: number | null
  latency_ms: number | null
  finish_reason: string | null
  error: string | null
  created_at: string
}

export interface Feedback {
  id: string
  message_id: string
  conversation_id: string
  execution_id: string | null
  prompt_version_id: string
  agent_id: string
  rating: 'positive' | 'negative'
  comment: string
  reviewer_name: string
  origin: 'human' | 'auto'
  status: 'pending' | 'processing' | 'processed' | 'dismissed'
  optimization_job_id: string | null
  created_at: string
}

export interface OptimizationJob {
  id: string
  agent_id: string
  base_version_id: string
  candidate_version_id: string | null
  feedback_ids: string[]
  status: 'queued' | 'optimizing' | 'testing' | 'completed' | 'failed'
  analysis: {
    diagnosis: string
    patterns: { kind: 'failure' | 'success'; description: string; feedback_ids: string[] }[]
  } | null
  error: string | null
  created_at: string
  finished_at: string | null
}

export interface TestCase {
  id: string
  agent_id: string
  name: string
  persona: string
  scenario: string
  expected_behavior: string
  origin: 'generated' | 'feedback' | 'manual'
  max_turns: number
}

export interface TestRun {
  id: string
  job_id: string | null
  prompt_version_id: string
  test_case_id: string
  conversation_id: string | null
  variant: 'baseline' | 'candidate'
  status: 'queued' | 'running' | 'completed' | 'failed'
  transcript: { role: 'user' | 'assistant'; content: string }[]
  score: number | null
  passed: boolean | null
  judge_reasoning: string | null
  error: string | null
  created_at: string
}
