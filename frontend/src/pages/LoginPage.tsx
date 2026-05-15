import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Tabs,
  Typewriter,
} from 'animal-island-ui'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useBgmUnlock } from '../bgm/BgmProvider'
import { modalTitleTypewriter } from '../i18n/modalProps'

export function LoginPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { setAuthToken } = useAuth()
  const { unlockAudio } = useBgmUnlock()
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [agree, setAgree] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [policyOpen, setPolicyOpen] = useState(false)

  const needAgree = agree.includes('ok')

  const tabItems = useMemo(
    () => [
      {
        key: 'login',
        label: t('login.tabLogin'),
        children: (
          <div className="form-stack">
            <Input
              placeholder={t('login.phUsername')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder={t('login.phPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        ),
      },
      {
        key: 'register',
        label: t('login.tabRegister'),
        children: (
          <div className="form-stack">
            <Input
              placeholder={t('login.phUsernameReg')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder={t('login.phPasswordReg')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              placeholder={t('login.phNickname')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        ),
      },
    ],
    [t, username, password, nickname],
  )

  const onLogin = async () => {
    setErr(null)
    if (!needAgree) {
      setErr(t('login.errAgree'))
      return
    }
    setBusy(true)
    try {
      const r = await apiFetch<{ token: string }>('/api/auth/login', {
        method: 'POST',
        json: { username, password },
      })
      await setAuthToken(r.token)
      unlockAudio()
      nav('/game/farm')
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('login.errLogin'))
    } finally {
      setBusy(false)
    }
  }

  const onRegister = async () => {
    setErr(null)
    if (!needAgree) {
      setErr(t('login.errAgree'))
      return
    }
    setBusy(true)
    try {
      const r = await apiFetch<{ token: string }>('/api/auth/register', {
        method: 'POST',
        json: { username, password, nickname: nickname || undefined },
      })
      await setAuthToken(r.token)
      unlockAudio()
      nav('/game/farm')
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('login.errRegister'))
    } finally {
      setBusy(false)
    }
  }

  const onGuest = async () => {
    setBusy(true)
    setErr(null)
    try {
      const r = await apiFetch<{ token: string }>('/api/auth/guest', { method: 'POST' })
      await setAuthToken(r.token)
      unlockAudio()
      nav('/game/farm')
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('login.errGuest'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page login-page">
      <div className="login-banner">
        <Typewriter speed={32}>{t('login.typewriter')}</Typewriter>
      </div>
      <Card color="app-green" className="login-card">
        <Tabs activeKey={tab} onChange={setTab} items={tabItems} />
        <div className="login-agree">
          <Checkbox
            options={[{ label: t('login.agree'), value: 'ok' }]}
            value={agree}
            onChange={(v) => setAgree(v as string[])}
          />
        </div>
        {err ? <p className="form-error">{err}</p> : null}
        <div className="form-stack">
          {tab === 'login' ? (
            <Button type="primary" block loading={busy} onClick={onLogin}>
              {t('login.submitLogin')}
            </Button>
          ) : (
            <Button type="primary" block loading={busy} onClick={onRegister}>
              {t('login.submitRegister')}
            </Button>
          )}
          <Button block loading={busy} onClick={onGuest}>
            {t('login.guest')}
          </Button>
          <Button type="link" block onClick={() => setPolicyOpen(true)}>
            {t('login.viewPolicy')}
          </Button>
        </div>
      </Card>
      <p className="login-back">
        <Link to="/">{t('login.backHome')}</Link>
      </p>

      <Modal
        open={policyOpen}
        title={t('login.policyTitle')}
        {...modalTitleTypewriter}
        onClose={() => setPolicyOpen(false)}
        footer={<Button onClick={() => setPolicyOpen(false)}>{t('common.close')}</Button>}
        maskClosable
      >
        <p>{t('login.policyBody')}</p>
      </Modal>
    </div>
  )
}
