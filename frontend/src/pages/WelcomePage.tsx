import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Modal, Typewriter } from 'animal-island-ui'
import { modalTitleTypewriter } from '../i18n/modalProps'
import { useBgmUnlock } from '../bgm/BgmProvider'

export function WelcomePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { unlockAudio } = useBgmUnlock()
  const [agreeOpen, setAgreeOpen] = useState(false)

  const start = () => {
    unlockAudio()
    nav('/login')
  }

  return (
    <div className="page welcome">
      <div className="welcome-hero">
        <h1 className="welcome-title">{t('welcome.title')}</h1>
        <div className="welcome-type">
          <Typewriter speed={32}>{t('welcome.typewriter')}</Typewriter>
        </div>
      </div>
      <div className="welcome-actions">
        <Button type="primary" size="large" block onClick={start}>
          {t('welcome.start')}
        </Button>
        <Button size="large" block onClick={() => setAgreeOpen(true)}>
          {t('welcome.intro')}
        </Button>
      </div>
      <footer className="welcome-foot">
        <span>{t('common.version')}</span>
        <button type="button" className="link" onClick={() => setAgreeOpen(true)}>
          {t('welcome.terms')}
        </button>
        <button type="button" className="link" onClick={() => setAgreeOpen(true)}>
          {t('welcome.privacy')}
        </button>
      </footer>

      <Modal
        open={agreeOpen}
        title={t('welcome.modalTitle')}
        {...modalTitleTypewriter}
        onClose={() => setAgreeOpen(false)}
        footer={
          <Button type="primary" onClick={() => setAgreeOpen(false)}>
            {t('welcome.modalOk')}
          </Button>
        }
        maskClosable
      >
        <p>{t('welcome.modalBody1')}</p>
        <p>{t('welcome.modalBody2')}</p>
      </Modal>
    </div>
  )
}
