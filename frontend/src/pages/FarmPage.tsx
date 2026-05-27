import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from 'animal-island-ui'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Emoji, EmojiLabel } from '../components/Emoji'
import { CROP_IDS } from '../constants'
import { cropEmoji, plotCellEmoji, PLOT_STATE_EMOJI } from '../emojis'
import { modalTitleTypewriter } from '../i18n/modalProps'
import type { FarmPlotJson, UserJson } from '../types'

function cropUnlockLevel(c: string): number {
  if (c === 'strawberry') return 8
  if (c === 'watermelon') return 5
  if (c === 'corn' || c === 'tomato' || c === 'potato') return 3
  return 1
}

export function FarmPage() {
  const { t } = useTranslation()
  const { user, applyUser } = useAuth()
  const [, setTick] = useState(0)
  const [modalPlot, setModalPlot] = useState<FarmPlotJson | null>(null)
  const [plantPick, setPlantPick] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const formatRemain = (matureAt: string | null): string => {
    if (!matureAt) return ''
    const ms = new Date(matureAt).getTime() - Date.now()
    if (ms <= 0) return t('farm.timeReady')
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return t('farm.timeRemain', { m, s })
  }

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const seedOptions = useMemo(() => {
    if (!user) return [] as { cropId: string; label: string; qty: number }[]
    return CROP_IDS.filter((c) => user.level >= cropUnlockLevel(c))
      .map((c) => {
        const sid = `seed_${c}`
        const qty = user.inventory.find((i) => i.itemId === sid)?.qty ?? 0
        return {
          cropId: c,
          label: t('farm.seedLabel', {
            name: `${cropEmoji(c)} ${t(`crop.${c}`)}`,
            count: qty,
          }),
          qty,
        }
      })
      .filter((x) => x.qty > 0)
  }, [user, t])

  if (!user) return null

  const run = async (fn: () => Promise<UserJson>): Promise<boolean> => {
    setBusy(true)
    setErr(null)
    try {
      const u = await fn()
      applyUser(u)
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('farm.errOp'))
      return false
    } finally {
      setBusy(false)
    }
  }

  const plot = modalPlot
  const remainLabel = plot ? formatRemain(plot.matureAt) : ''

  return (
    <div className="farm-page">
      <p className="farm-hint">
        <Emoji size="md">👆</Emoji>
        {t('farm.hint')}
      </p>
      {err ? <p className="form-error">{err}</p> : null}
      <div className="plot-grid">
        {user.farmPlots.map((p) => (
          <button
            key={p.index}
            type="button"
            className={`plot-cell state-${p.state}`}
            onClick={() => {
              setPlantPick(false)
              setModalPlot(p)
            }}
          >
            <span className="plot-idx">{p.index + 1}</span>
            <span className="plot-cell-emoji" aria-hidden>
              {plotCellEmoji(p.state, p.cropId)}
            </span>
            {p.state === 'growing' || p.state === 'mature' ? (
              <span className="plot-crop">
                {p.cropId ? t(`crop.${p.cropId}`, { defaultValue: p.cropId }) : ''}
              </span>
            ) : null}
            {p.state === 'growing' ? (
              <span className="plot-time">{formatRemain(p.matureAt)}</span>
            ) : null}
          </button>
        ))}
      </div>

      <Modal
        open={!!plot}
        title={plot ? t('farm.plotTitle', { n: plot.index + 1 }) : ''}
        {...modalTitleTypewriter}
        onClose={() => {
          setModalPlot(null)
          setPlantPick(false)
        }}
        maskClosable
        footer={null}
      >
        {plot ? (
          <div className="plot-modal">
            <div className="plot-modal-hero">
              <Emoji size="hero">{plotCellEmoji(plot.state, plot.cropId)}</Emoji>
            </div>
            <p>
              {PLOT_STATE_EMOJI[plot.state]}{' '}
              {t('farm.stateLine', {
                state: t(`plot.state.${plot.state}`, { defaultValue: plot.state }),
              })}
            </p>
            {plot.state === 'locked' ? (
              <p>
                <Emoji size="sm">🔒</Emoji> {t('farm.lockedHelp')}
              </p>
            ) : null}
            {plot.state === 'wasteland' ? (
              <Button
                type="primary"
                loading={busy}
                onClick={async () => {
                  const ok = await run(() =>
                    apiFetch<UserJson>(`/api/farm/plots/${plot.index}/till`, { method: 'POST' }),
                  )
                  if (ok) setModalPlot(null)
                }}
              >
                <EmojiLabel emoji="⛏️">{t('farm.till')}</EmojiLabel>
              </Button>
            ) : null}
            {plot.state === 'tilled' && !plantPick ? (
              <Button type="primary" onClick={() => setPlantPick(true)} disabled={busy}>
                <EmojiLabel emoji="🌱">{t('farm.plant')}</EmojiLabel>
              </Button>
            ) : null}
            {plot.state === 'tilled' && plantPick ? (
              <div className="seed-list">
                <Button type="link" onClick={() => setPlantPick(false)}>
                  {t('common.back')}
                </Button>
                {seedOptions.length === 0 ? (
                  <p>
                    <Emoji size="sm">🛒</Emoji> {t('farm.noSeeds')}
                  </p>
                ) : (
                  seedOptions.map((s) => (
                    <Button
                      key={s.cropId}
                      block
                      loading={busy}
                      onClick={async () => {
                        const ok = await run(() =>
                          apiFetch<UserJson>(`/api/farm/plots/${plot.index}/plant`, {
                            method: 'POST',
                            json: { cropId: s.cropId },
                          }),
                        )
                        if (ok) {
                          setPlantPick(false)
                          setModalPlot(null)
                        }
                      }}
                    >
                      {s.label}
                    </Button>
                  ))
                )}
              </div>
            ) : null}
            {plot.state === 'growing' ? (
              <>
                <p>
                  <Emoji size="sm">⏳</Emoji> {t('farm.remain', { time: remainLabel })}
                </p>
                <p>
                  <Emoji size="sm">💧</Emoji> {t('farm.watered', { n: plot.wateredTimes })}
                </p>
                <div className="row-actions">
                  <Button
                    loading={busy}
                    onClick={() =>
                      run(() =>
                        apiFetch<UserJson>(`/api/farm/plots/${plot.index}/water`, {
                          method: 'POST',
                        }),
                      )
                    }
                  >
                    <EmojiLabel emoji="💧">{t('farm.water')}</EmojiLabel>
                  </Button>
                </div>
                <div className="row-actions">
                  <Button
                    loading={busy}
                    onClick={() =>
                      run(() =>
                        apiFetch<UserJson>(`/api/farm/plots/${plot.index}/fertilize`, {
                          method: 'POST',
                          json: { itemId: 'fertilizer_normal' },
                        }),
                      )
                    }
                  >
                    <EmojiLabel emoji="🧪">{t('farm.fertNormal')}</EmojiLabel>
                  </Button>
                  <Button
                    loading={busy}
                    onClick={() =>
                      run(() =>
                        apiFetch<UserJson>(`/api/farm/plots/${plot.index}/fertilize`, {
                          method: 'POST',
                          json: { itemId: 'fertilizer_advanced' },
                        }),
                      )
                    }
                  >
                    <EmojiLabel emoji="✨">{t('farm.fertAdv')}</EmojiLabel>
                  </Button>
                </div>
              </>
            ) : null}
            {plot.state === 'mature' ? (
              <Button
                type="primary"
                loading={busy}
                onClick={async () => {
                  const ok = await run(() =>
                    apiFetch<UserJson>(`/api/farm/plots/${plot.index}/harvest`, {
                      method: 'POST',
                    }),
                  )
                  if (ok) setModalPlot(null)
                }}
              >
                <EmojiLabel emoji="🧺">{t('farm.harvest')}</EmojiLabel>
              </Button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
