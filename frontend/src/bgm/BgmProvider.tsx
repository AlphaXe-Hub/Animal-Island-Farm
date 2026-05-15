import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const BGM = {
  welcome: '/bgm/bgm1_欢迎界面_登录注册页.mp3',
  farm: '/bgm/bgm2_农村主场景核心界面任务签到界面.mp3',
  shop: '/bgm/bgm3_商店_仓库_个人中心.mp3',
} as const

type Track = (typeof BGM)[keyof typeof BGM]

function trackForPath(pathname: string): Track {
  if (pathname === '/' || pathname.startsWith('/login')) return BGM.welcome
  if (
    pathname.includes('/shop') ||
    pathname.includes('/inventory') ||
    pathname.includes('/profile')
  ) {
    return BGM.shop
  }
  if (pathname.startsWith('/game')) return BGM.farm
  return BGM.welcome
}

const Ctx = createContext<{ unlockAudio: () => void } | null>(null)

export function useBgmUnlock(): { unlockAudio: () => void } {
  const c = useContext(Ctx)
  if (!c) throw new Error('useBgmUnlock outside BgmProvider')
  return c
}

export function BgmProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)
  const soundOn = user?.soundOn ?? true
  const track = useMemo(() => trackForPath(pathname), [pathname])

  const unlockAudio = () => {
    unlockedRef.current = true
  }

  useEffect(() => {
    const el = new Audio()
    el.loop = true
    el.volume = 0.35
    audioRef.current = el
    return () => {
      el.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.src = track
    if (!soundOn) {
      el.pause()
      return
    }
    if (!unlockedRef.current) return
    void el.play().catch(() => {})
  }, [track, soundOn])

  return <Ctx.Provider value={{ unlockAudio }}>{children}</Ctx.Provider>
}
