import type { Wallet } from '@/contracts/wallet'
export function seedWallets(): Record<string, Wallet[]> {
  return Object.fromEntries(['alice', 'bob'].map((id, index) => [id, [{
    id: `wallet-${id}`, version: 1, label: 'Principal', role: 'primary', network: 'ethereum',
    provider: 'metamask', address: `0x${String(index + 1).repeat(40)}`, secondaryAddress: '',
    collector: { displayName: id === 'alice' ? 'Alice' : 'Bob', username: id, profileName: `Coleção ${id}`, email: `${id}@kurio.test`, referralCode: 'KURIO', ensName: `${id}.eth`, notes: '' },
  } satisfies Wallet]]))
}
