-- Issues found by the confidence scorer, and automatic feedback for low-confidence replies.
alter table public.messages
  add column confidence_issues jsonb not null default '[]'::jsonb;

-- 'human' = left by a reviewer; 'auto' = filed by the confidence scorer below the threshold.
alter table public.feedbacks
  add column origin text not null default 'human' check (origin in ('human', 'auto'));
