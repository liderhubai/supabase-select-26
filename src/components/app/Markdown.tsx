import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-invert max-w-none text-[14px] leading-[1.45] text-inherit prose-p:my-[6px] prose-ul:my-[6px] prose-ol:my-[6px] prose-li:my-0 prose-strong:text-inherit first:prose-p:mt-0 last:prose-p:mb-0',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
