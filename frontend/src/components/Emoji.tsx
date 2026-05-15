import type { ReactNode } from 'react'

type EmojiSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

export function Emoji({
  children,
  size = 'md',
  className = '',
  label,
}: {
  children: ReactNode
  size?: EmojiSize
  className?: string
  /** 无障碍：有文案时可省略 */
  label?: string
}) {
  return (
    <span
      className={`emoji emoji-${size} ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </span>
  )
}

export function EmojiLabel({
  emoji,
  children,
  className = '',
}: {
  emoji: string
  children: ReactNode
  className?: string
}) {
  return (
    <span className={`emoji-label ${className}`.trim()}>
      <Emoji size="sm">{emoji}</Emoji>
      <span>{children}</span>
    </span>
  )
}
