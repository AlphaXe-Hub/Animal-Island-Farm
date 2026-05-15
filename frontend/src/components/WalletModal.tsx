import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Modal } from 'animal-island-ui'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Emoji, EmojiLabel } from '../components/Emoji'
import { modalTitleTypewriter } from '../i18n/modalProps'
import type { UserJson } from '../types'

interface TxRow {
  id: string
  currency: string
  amount: number
  reason: string
  createdAt: string
}

export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { applyUser } = useAuth()
  const [items, setItems] = useState<TxRow[]>([])
  const [busy, setBusy] = useState(false)

  const loadTx = async () => {
    const r = await apiFetch<{ items: TxRow[] }>('/api/wallet/transactions?limit=30')
    setItems(r.items)
  }

  useEffect(() => {
    if (open) void loadTx().catch(() => {})
  }, [open])

  const recharge = async (tierId: string) => {
    setBusy(true)
    try {
      const u = await apiFetch<UserJson>('/api/wallet/mock-recharge', {
        method: 'POST',
        json: { tierId },
      })
      applyUser(u)
      await loadTx()
    } finally {
      setBusy(false)
    }
  }

  const curLabel = (c: string) =>
    t(`wallet.currency.${c}`, { defaultValue: c })

  const reasonLabel = (r: string) =>
    t(`wallet.reason.${r}`, { defaultValue: r })

  return (
    <Modal
      open={open}
      title={t('wallet.title')}
      {...modalTitleTypewriter}
      onClose={onClose}
      maskClosable
      footer={
        <Button type="primary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <p>
        <Emoji size="sm">💡</Emoji> {t('wallet.mockHint')}
      </p>
      <div className="recharge-row">
        <Button loading={busy} onClick={() => recharge('t60')}>
          <EmojiLabel emoji="💎">{t('wallet.add60')}</EmojiLabel>
        </Button>
        <Button loading={busy} onClick={() => recharge('t300')}>
          <EmojiLabel emoji="💎">{t('wallet.add300')}</EmojiLabel>
        </Button>
        <Button loading={busy} onClick={() => recharge('t980')}>
          <EmojiLabel emoji="💎">{t('wallet.add980')}</EmojiLabel>
        </Button>
      </div>
      <h4>
        <Emoji size="sm">📜</Emoji> {t('wallet.recent')}
      </h4>
      <div className="tx-list">
        {items.map((row) => (
          <Card key={row.id} color="default" className="tx-card">
            <div>
              {row.amount > 0 ? '📈' : '📉'} {curLabel(row.currency)}{' '}
              {row.amount > 0 ? '+' : ''}
              {row.amount}
            </div>
            <div>{reasonLabel(row.reason)}</div>
            <div className="tx-time">{new Date(row.createdAt).toLocaleString()}</div>
          </Card>
        ))}
      </div>
    </Modal>
  )
}
