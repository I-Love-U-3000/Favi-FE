'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { UnicornScene } from 'unicornstudio-react/next'

import { cn } from './lib/utils'
import { THEMES, ThemeKey, DEFAULT_THEME_KEY } from '@/theme/themes'

export const useWindowSize = () => {
  const [isMounted, setIsMounted] = useState(false)
  const [windowSize, setWindowSize] = useState({
    width: globalThis.window !== undefined ? window.innerWidth : 0,
    height: globalThis.window !== undefined ? window.innerHeight : 0
  })

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      return
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)

    // Call handler right away so state gets updated with initial window size
    handleResize()

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [isMounted])

  return windowSize
}

export function AuthBackground({
  className
}: {
  className?: string
} = {}) {
  const { width, height } = useWindowSize()
  const [isMounted, setIsMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const themeInfo = useMemo(() => {
    const key = (resolvedTheme as ThemeKey) || DEFAULT_THEME_KEY
    return THEMES[key] ?? THEMES[DEFAULT_THEME_KEY]
  }, [resolvedTheme])

  const [colors, setColors] = useState(() => ({
    primary: themeInfo.palette.primary,
    accent: themeInfo.palette.accent,
    glow: themeInfo.palette.glow,
    background: themeInfo.palette.background,
    mode: themeInfo.mode,
  }))

  useEffect(() => {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    try {
      const computed = getComputedStyle(html)
      const read = (token: string, fallback: string) => {
        const value = computed.getPropertyValue(token)
        return value?.trim() || fallback
      }
      setColors({
        primary: read('--auth-primary', themeInfo.palette.primary),
        accent: read('--auth-accent', themeInfo.palette.accent),
        glow: read('--auth-glow', themeInfo.palette.glow),
        background: read('--auth-background', themeInfo.palette.background),
        mode: (html.dataset.themeMode as 'light' | 'dark') ?? themeInfo.mode,
      })
    } catch {
      setColors({
        primary: themeInfo.palette.primary,
        accent: themeInfo.palette.accent,
        glow: themeInfo.palette.glow,
        background: themeInfo.palette.background,
        mode: themeInfo.mode,
      })
    }
  }, [themeInfo, resolvedTheme])

  const overlayStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at 20% 20%, ${colors.background}33 0%, transparent 55%), radial-gradient(circle at 80% 20%, ${colors.accent}22 0%, transparent 45%)`,
    }),
    [colors]
  )
  const isDarkMode = colors.mode === 'dark'

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      return
    }
  }, [isMounted])

  if (!isMounted) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 bottom-0 right-0 flex flex-col items-center opacity-80',
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none" style={overlayStyle} />
      <UnicornScene
        production={true}
        jsonFilePath={`/animations/raycast-${isDarkMode ? 'dark' : 'light'}.json`}
        width={width}
        height={height}
      />
    </div>
  )
}
