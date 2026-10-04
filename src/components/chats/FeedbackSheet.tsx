'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Mic, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { readReviewerName, useSaveFeedback, type FeedbackTarget, type Rating } from '@/components/app/FeedbackModal'

// Minimal Web Speech API typings (not shipped in lib.dom).
type SpeechResult = { readonly isFinal: boolean; [index: number]: { transcript: string } }
type SpeechEvent = Event & { readonly resultIndex: number; readonly results: { readonly length: number; [index: number]: SpeechResult } }
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechEvent) => void) | null
  onerror: ((e: Event & { readonly error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type SpeechRecognitionCtor = new () => SpeechRecognition

function speechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const noopSubscribe = () => () => {}
const appendText = (base: string, text: string) => (text.trim() ? (base && !/\s$/.test(base) ? `${base} ` : base) + text.trim() : base)
export type FeedbackSelection = { target: FeedbackTarget; rating: Rating; seq: number }

type Props = { open: boolean; selection: FeedbackSelection | null; onRatingChange: (r: Rating) => void; onClose: () => void }

/** Right-docked sheet (not an overlay) to rate an agent reply; the thread shrinks to make room. */
export function FeedbackSheet({ open, selection, onRatingChange, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <aside
      aria-label="Feedback"
      aria-hidden={!open}
      inert={!open}
      className={cn('h-full shrink-0 overflow-hidden border-border bg-surface transition-[width] duration-300 ease-out', open ? 'w-[340px] border-l' : 'w-0')}
    >
      {/* Keyed per opening so the form resets; it stays mounted while collapsing. */}
      {selection && <FeedbackForm key={selection.seq} open={open} selection={selection} onRatingChange={onRatingChange} onClose={onClose} />}
    </aside>
  )
}

function FeedbackForm({ open, selection, onClose }: Props & { selection: FeedbackSelection }) {
  const { target, rating } = selection
  const [comment, setComment] = useState('')
  const [reviewer] = useState(readReviewerName)
  const save = useSaveFeedback({
    onSuccess: () => {
      toast.success('Feedback sent', { description: 'Added to the review queue.' })
      onClose()
    },
  })

  const supported = useSyncExternalStore(noopSubscribe, () => !!speechRecognitionCtor(), () => false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [recording, setRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const interimRef = useRef('') // mirrors `interim` for handlers that close over stale state
  const [voiceError, setVoiceError] = useState<string | null>(null)

  // Detaches and stops the active recognition without touching state (safe on unmount).
  const teardown = () => {
    const rec = recognitionRef.current
    if (!rec) return false
    recognitionRef.current = null
    rec.onresult = rec.onerror = rec.onend = null
    rec.stop()
    return true
  }

  // Stops dictation and keeps any not-yet-final words; returns them so callers can use them synchronously.
  const stopRecording = () => {
    const pending = interimRef.current
    interimRef.current = ''
    if (!teardown()) return ''
    setRecording(false)
    setInterim('')
    if (pending.trim()) setComment((c) => appendText(c, pending))
    return pending
  }

  const startRecording = () => {
    const Ctor = speechRecognitionCtor()
    const rec = Ctor && new Ctor()
    if (!rec) return
    Object.assign(rec, { continuous: true, interimResults: true, lang: navigator.language })
    rec.onresult = (e) => {
      let finalText = ''
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript
        else interimText += e.results[i][0].transcript
      }
      interimRef.current = interimText
      setInterim(interimText)
      if (finalText.trim()) setComment((c) => appendText(c, finalText))
    }
    rec.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return
      setVoiceError(e.error === 'not-allowed' ? 'Microphone access was denied.' : `Voice input error: ${e.error}`)
    }
    rec.onend = stopRecording // browser ended the session (silence, error): reset the UI
    setVoiceError(null)
    try {
      rec.start()
      recognitionRef.current = rec
      setRecording(true)
    } catch {
      setVoiceError('Could not start voice input.')
    }
  }

  // Stop dictation when the sheet closes or the form unmounts (switching message).
  useEffect(() => {
    if (!open) stopRecording()
  }, [open])
  useEffect(() => () => void teardown(), [])

  const submit = () => {
    if (save.isPending) return
    save.mutate({ target, rating, comment: appendText(comment, stopRecording()), reviewer })
  }

  const hasText = !!(comment.trim() || interim.trim())

  return (
    <div className="flex h-full w-[340px] flex-col">
      <header className="flex h-[56px] shrink-0 items-center gap-[12px] border-b border-border px-[20px]">
        <h2 className="flex-1 text-[15px] font-semibold text-foreground">Reply feedback</h2>
        <button type="button" aria-label="Close feedback" title="Close (Esc)" onClick={onClose} className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised">
          <X size={16} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-[24px] overflow-y-auto p-[20px]">
        <h3 className="text-[20px] leading-[1.3] font-semibold text-foreground">What happened, and how can we improve?</h3>

        <div className="flex flex-col items-center gap-[12px] py-[8px]">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={!supported}
            aria-pressed={recording}
            aria-label={recording ? 'Stop recording' : 'Record feedback by voice'}
            className={cn(
              'flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              recording ? 'animate-pulse border-error bg-error text-white' : 'border-foreground text-foreground hover:bg-surface-raised',
            )}
          >
            <Mic size={28} />
          </button>
          <span className={cn('text-[13px]', recording ? 'text-error' : 'text-muted-foreground')} aria-live="polite">
            {!supported ? 'Voice input isn\u2019t supported in this browser' : recording ? 'Listening… tap to stop' : 'Tap to speak'}
          </span>
          {voiceError && <p className="text-center text-[12px] text-error">{voiceError}</p>}
        </div>

        {hasText && (
          <div className="flex flex-col gap-[4px]">
            <textarea
              aria-label="Feedback transcript"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full resize-none bg-transparent text-[14px] leading-[1.6] text-foreground outline-none"
            />
            {interim && <p className="text-[14px] leading-[1.6] text-subtle-foreground italic">{interim}</p>}
          </div>
        )}
      </div>

      <footer className="flex shrink-0 flex-col items-end gap-[8px] border-t border-border px-[20px] py-[16px]">
        {save.error && <p className="self-stretch text-[13px] text-error">{save.error.message}</p>}
        <button type="button" onClick={submit} disabled={save.isPending || !hasText} className="flex h-[40px] items-center justify-center rounded-full bg-primary px-[20px] text-[14px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {save.isPending ? 'Sending…' : 'Send to queue'}
        </button>
      </footer>
    </div>
  )
}
