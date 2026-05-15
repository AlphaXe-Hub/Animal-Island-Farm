import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Time } from 'animal-island-ui'
import { Emoji, EmojiLabel } from '../components/Emoji'
import { NAV_EMOJI } from '../emojis'
import { useAuth } from '../auth/AuthContext'

const TAB_KEYS = ['farm', 'inventory', 'shop', 'tasks', 'profile'] as const

const NAV_KEYS: (typeof TAB_KEYS)[number][] = [
  'farm',
  'inventory',
  'shop',
  'tasks',
  'profile',
]

export function GameShell() {
  const { t } = useTranslation()
  const { user, logout, loading } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const seg = loc.pathname.split('/')[2] || 'farm'
  const active = TAB_KEYS.includes(seg as (typeof TAB_KEYS)[number]) ? seg : 'farm'

  if (loading && !user) {
    return (
      <div className="page center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page center">
        <p>{t('common.loginRequired')}</p>
        <Button type="primary" onClick={() => nav('/login')}>
          {t('common.goLogin')}
        </Button>
      </div>
    )
  }

  return (
    <div className="game-shell">
      <aside className="game-sidenav" aria-label={t('nav.aria')}>
        <nav className="game-sidenav-nav">
          {NAV_KEYS.map((key) => (
            <Button
              key={key}
              type={active === key ? 'primary' : 'default'}
              block
              className="game-sidenav-btn"
              onClick={() => nav(`/game/${key}`)}
            >
              <span className="nav-btn-inner">
                <span className="nav-btn-emoji" aria-hidden>
                  {NAV_EMOJI[key]}
                </span>
                <span>{t(`nav.${key}`)}</span>
              </span>
            </Button>
          ))}
        </nav>
      </aside>

      <div className="game-body">
        <header className="game-top">
          <Card color="app-yellow" className="status-card">
            <div className="status-row">
              <span>
                <Emoji size="sm">🐻</Emoji> <strong>{user.nickname}</strong>{' '}
                <EmojiLabel emoji="🎖️">
                  {t('common.level')}
                  {user.level}
                </EmojiLabel>
              </span>
              <Time />
            </div>
            <div className="status-row">
              <EmojiLabel emoji="🪙">
                {t('common.coins')} {user.coins}
              </EmojiLabel>
              <EmojiLabel emoji="💎">
                {t('common.diamonds')} {user.diamonds}
              </EmojiLabel>
              <EmojiLabel emoji="⚡">
                {t('common.stamina')} {user.stamina}
              </EmojiLabel>
            </div>
            <div className="status-bar">
              <EmojiLabel emoji="⭐">
                {t('common.exp')} {user.exp}/{user.expToNext}
              </EmojiLabel>
            </div>
          </Card>
          <div className="top-actions">
            <Button size="small" onClick={() => void logout()}>
              {t('common.logout')}
            </Button>
          </div>
        </header>

        <main className="game-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
