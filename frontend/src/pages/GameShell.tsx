import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Time } from 'animal-island-ui'
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
              {t(`nav.${key}`)}
            </Button>
          ))}
        </nav>
      </aside>

      <div className="game-body">
        <header className="game-top">
          <Card color="app-yellow" className="status-card">
            <div className="status-row">
              <span>
                <strong>{user.nickname}</strong> {t('common.level')}
                {user.level}
              </span>
              <Time />
            </div>
            <div className="status-row">
              <span>
                {t('common.coins')} {user.coins}
              </span>
              <span>
                {t('common.diamonds')} {user.diamonds}
              </span>
              <span>
                {t('common.stamina')} {user.stamina}
              </span>
            </div>
            <div className="status-bar">
              <span>
                {t('common.exp')} {user.exp}/{user.expToNext}
              </span>
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
