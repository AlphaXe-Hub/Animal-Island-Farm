import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Switch } from 'animal-island-ui'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { UserJson } from '../types'
import { WalletModal } from '../components/WalletModal'
import { Emoji, EmojiLabel } from '../components/Emoji'
import { setAppLanguage, type AppLang } from '../i18n/config'

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, applyUser, logout } = useAuth()
  const nav = useNavigate()
  const [walletOpen, setWalletOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!user) return null

  const patchSound = async (soundOn: boolean) => {
    setBusy(true)
    try {
      const u = await apiFetch<UserJson>('/api/me/settings', {
        method: 'PATCH',
        json: { soundOn },
      })
      applyUser(u)
    } finally {
      setBusy(false)
    }
  }

  const setLang = (lng: AppLang) => {
    setAppLanguage(lng)
  }

  return (
    <div className="profile-page">
      <Card color="warm-peach-pink">
        <div className="profile-avatar" aria-hidden>
          {user.isGuest ? '🦊' : '🐻'}
        </div>
        <h3>{user.nickname}</h3>
        <p>
          {t('common.level')} {user.level}
        </p>
        {user.isGuest ? (
          <p>
            <Emoji size="sm">⚠️</Emoji> {t('profile.guestHint')}
          </p>
        ) : null}
      </Card>
      <div className="profile-row">
        <span>{t('profile.language')}</span>
        <div className="lang-btns">
          <Button size="small" type={i18n.language === 'zh' ? 'primary' : 'default'} onClick={() => setLang('zh')}>
            {t('profile.langZh')}
          </Button>
          <Button size="small" type={i18n.language === 'en' ? 'primary' : 'default'} onClick={() => setLang('en')}>
            {t('profile.langEn')}
          </Button>
        </div>
      </div>
      <div className="profile-row">
        <span>
          <Emoji size="sm">🎵</Emoji> {t('profile.bgm')}
        </span>
        <Switch
          checked={user.soundOn}
          onChange={(v) => void patchSound(v)}
          disabled={busy}
        />
      </div>
      <Button type="primary" block onClick={() => setWalletOpen(true)}>
        <EmojiLabel emoji="💎">{t('profile.wallet')}</EmojiLabel>
      </Button>
      <Button block onClick={() => void logout()}>
        <EmojiLabel emoji="👋">{t('profile.logout')}</EmojiLabel>
      </Button>
      <Button type="link" block onClick={() => nav('/')}>
        <EmojiLabel emoji="🏠">{t('profile.backWelcome')}</EmojiLabel>
      </Button>

      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  )
}
