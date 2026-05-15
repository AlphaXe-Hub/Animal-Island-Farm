import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Collapse } from 'animal-island-ui'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { UserJson } from '../types'

function categoryKey(id: string): 'crop' | 'seed' | 'fertilizer' | 'decoration' | 'prop' | 'other' {
  if (id.startsWith('crop_')) return 'crop'
  if (id.startsWith('seed_')) return 'seed'
  if (id.startsWith('fertilizer_')) return 'fertilizer'
  if (id.startsWith('decoration_')) return 'decoration'
  if (id.startsWith('prop_')) return 'prop'
  return 'other'
}

export function InventoryPage() {
  const { t } = useTranslation()
  const { user, applyUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!user) return null

  const grouped = new Map<string, { itemId: string; qty: number }[]>()
  for (const row of user.inventory) {
    if (row.qty <= 0) continue
    const ck = categoryKey(row.itemId)
    if (!grouped.has(ck)) grouped.set(ck, [])
    grouped.get(ck)!.push(row)
  }

  const itemName = (itemId: string) => t(`item.${itemId}`, { defaultValue: itemId })

  const sell = async (itemId: string) => {
    setBusy(true)
    setErr(null)
    try {
      const u = await apiFetch<UserJson>('/api/inventory/sell', {
        method: 'POST',
        json: { itemId, quantity: 1 },
      })
      applyUser(u)
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('inv.errSell'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inv-page">
      {err ? <p className="form-error">{err}</p> : null}
      {[...grouped.entries()].map(([ck, rows]) => (
        <Collapse
          key={ck}
          question={<strong>{t(`inv.cat.${ck}`)}</strong>}
          answer={
            <div className="inv-rows">
              {rows.map((r) => (
                <Card key={r.itemId} color="app-pink" className="inv-card">
                  <div>{itemName(r.itemId)}</div>
                  <div>
                    {t('common.qty')} {r.qty}
                  </div>
                  {r.itemId.startsWith('crop_') ? (
                    <Button size="small" loading={busy} onClick={() => sell(r.itemId)}>
                      {t('common.sellOne')}
                    </Button>
                  ) : null}
                </Card>
              ))}
            </div>
          }
          defaultExpanded
        />
      ))}
      {grouped.size === 0 ? <p>{t('inv.empty')}</p> : null}
    </div>
  )
}
