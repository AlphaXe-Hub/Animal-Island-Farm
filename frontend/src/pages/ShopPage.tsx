import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Input } from 'animal-island-ui'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Emoji, EmojiLabel } from '../components/Emoji'
import { itemEmoji, SHOP_CAT_EMOJI } from '../emojis'
import type { ShopCatalogItem, UserJson } from '../types'

export function ShopPage() {
  const { t } = useTranslation()
  const { applyUser } = useAuth()
  const [items, setItems] = useState<ShopCatalogItem[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    const r = await apiFetch<{ items: ShopCatalogItem[] }>('/api/shop/catalog')
    setItems(r.items)
  }

  useEffect(() => {
    void load().catch(() => {})
  }, [])

  const displayName = (it: ShopCatalogItem) =>
    t(`shop.item.${it.id}`, { defaultValue: it.name })

  const categoryLabel = (it: ShopCatalogItem) =>
    t(`shop.cat.${it.category}`, { defaultValue: it.category })

  const buy = async (itemId: string) => {
    setBusy(true)
    setErr(null)
    try {
      const u = await apiFetch<UserJson>('/api/shop/purchase', {
        method: 'POST',
        json: { itemId, quantity: 1 },
      })
      applyUser(u)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('shop.errBuy'))
    } finally {
      setBusy(false)
    }
  }

  const qTrim = q.trim()
  const filtered = items.filter((i) => displayName(i).includes(qTrim) || i.name.includes(qTrim))

  return (
    <div className="shop-page">
      <Input
        placeholder={`🔍 ${t('shop.searchPh')}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {err ? <p className="form-error">{err}</p> : null}
      <div className="shop-list">
        {filtered.map((it) => (
          <Card key={it.id} color="app-teal" className="shop-card">
            <div className="shop-card-head">
              <Emoji size="lg">{itemEmoji(it.id)}</Emoji>
              <div className="shop-card-title">{displayName(it)}</div>
            </div>
            <div className="shop-meta">
              {it.priceCoins != null ? (
                <EmojiLabel emoji="🪙">
                  {t('common.coins')} {it.priceCoins}
                </EmojiLabel>
              ) : null}
              {it.priceDiamonds != null ? (
                <EmojiLabel emoji="💎">
                  {t('common.diamonds')} {it.priceDiamonds}
                </EmojiLabel>
              ) : null}
            </div>
            <p className="shop-cat">
              {SHOP_CAT_EMOJI[it.category] ?? '📦'}{' '}
              {t('shop.category', { cat: categoryLabel(it) })}
            </p>
            <Button
              type="primary"
              block
              disabled={!it.unlocked || busy}
              loading={busy}
              onClick={() => buy(it.id)}
            >
              {it.unlocked ? (
                <EmojiLabel emoji="🛒">{t('shop.buy')}</EmojiLabel>
              ) : (
                t('shop.unlockAt', { lv: it.unlockLevel })
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
