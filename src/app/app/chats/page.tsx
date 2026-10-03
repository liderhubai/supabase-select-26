import { ChatsScreen } from '@/components/chats/ChatsScreen'

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams
  return <ChatsScreen initialId={c} />
}
