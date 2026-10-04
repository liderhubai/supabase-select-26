import { ChatsScreen } from '@/components/chats/ChatsScreen'

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ c?: string; m?: string }> }) {
  const { c, m } = await searchParams
  return <ChatsScreen initialId={c} initialMessageId={m} />
}
