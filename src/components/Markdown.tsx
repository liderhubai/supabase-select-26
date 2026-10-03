import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

/** Renderiza mensagens do chat em markdown (negrito, listas, tabelas, links, código). */
export function Markdown({ children, invert, className }: { children: string; invert?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:mb-1 prose-headings:mt-2 prose-pre:my-2 prose-table:my-2 first:prose-p:mt-0 last:prose-p:mb-0',
        invert && 'prose-invert',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" /> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
