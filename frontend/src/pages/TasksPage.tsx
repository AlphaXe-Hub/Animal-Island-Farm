import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card } from 'animal-island-ui'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { TaskRow, UserJson } from '../types'

export function TasksPage() {
  const { t } = useTranslation()
  const { applyUser } = useAuth()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [sign, setSign] = useState<{
    weekKey: string
    claimedDays: number[]
    rewards: { day: number; coins: number; diamonds: number }[]
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    const [ta, s] = await Promise.all([
      apiFetch<{ tasks: TaskRow[] }>('/api/tasks'),
      apiFetch<{
        weekKey: string
        claimedDays: number[]
        rewards: { day: number; coins: number; diamonds: number }[]
      }>('/api/signin'),
    ])
    setTasks(ta.tasks)
    setSign(s)
  }

  useEffect(() => {
    void load().catch(() => {})
  }, [])

  const taskTitle = (row: TaskRow) =>
    t(`taskTitles.${row.id}`, { defaultValue: row.title })

  const claimTask = async (taskId: string) => {
    setBusy(true)
    setErr(null)
    try {
      const u = await apiFetch<UserJson>('/api/tasks/claim', {
        method: 'POST',
        json: { taskId },
      })
      applyUser(u)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('tasks.errClaim'))
    } finally {
      setBusy(false)
    }
  }

  const claimSign = async () => {
    setBusy(true)
    setErr(null)
    try {
      const u = await apiFetch<UserJson>('/api/signin/claim', { method: 'POST' })
      applyUser(u)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('tasks.errSign'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="tasks-page">
      {err ? <p className="form-error">{err}</p> : null}
      <Card color="app-yellow" className="sign-card">
        <h3>{t('tasks.signTitle')}</h3>
        {sign ? (
          <>
            <p>{t('tasks.week', { wk: sign.weekKey })}</p>
            <p>
              {t('tasks.signed', {
                list: sign.claimedDays.join(', ') || t('tasks.none'),
              })}
            </p>
            <Button type="primary" loading={busy} onClick={claimSign}>
              {t('tasks.signBtn')}
            </Button>
          </>
        ) : null}
      </Card>
      <h3>{t('tasks.section')}</h3>
      {tasks.map((row) => (
        <Card key={row.id} color="app-blue" className="task-card">
          <div>{taskTitle(row)}</div>
          <div>{t('tasks.progress', { a: row.progress, b: row.target })}</div>
          <div>
            {t('tasks.rewards', {
              c: row.rewardCoins,
              d: row.rewardDiamonds,
              e: row.rewardExp,
            })}
          </div>
          <Button
            type="primary"
            disabled={!row.done || row.claimed || busy}
            loading={busy}
            onClick={() => claimTask(row.id)}
          >
            {row.claimed ? t('tasks.btnClaimed') : row.done ? t('tasks.btnClaim') : t('tasks.btnTodo')}
          </Button>
        </Card>
      ))}
    </div>
  )
}
