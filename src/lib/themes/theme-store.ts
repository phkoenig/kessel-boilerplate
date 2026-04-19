"use client"

/**
 * Client-seitiger ThemeStore mit useSyncExternalStore.
 *
 * Aus iryse portiert. Haelt den aktuellen ThemeSnapshot in einem Modul-Singleton und
 * synchronisiert alle Abonnenten (ThemeProvider, Debug-UIs) ueber useSyncExternalStore.
 */

import { useCallback, useSyncExternalStore } from "react"
import { fetchThemeSnapshot, updateEffectiveThemeSelection } from "@/lib/themes/storage"
import { DEFAULT_THEME_ID } from "@/lib/themes/constants"
import type { CornerStyle, ThemeColorScheme, ThemeSnapshot } from "@/lib/themes/types"

interface ThemeStoreSnapshot extends ThemeSnapshot {
  isLoading: boolean
  error: string | null
}

interface ThemeStoreRecord {
  snapshot: ThemeStoreSnapshot
  listeners: Set<() => void>
  bootstrapPromise: Promise<void> | null
}

const initialSnapshot: ThemeStoreSnapshot = {
  activeThemeId: DEFAULT_THEME_ID,
  theme: DEFAULT_THEME_ID,
  themes: [],
  cssText: null,
  colorScheme: "system",
  cornerStyle: "rounded",
  canManageAppTheme: false,
  canSelectTheme: false,
  isAdmin: false,
  isAuthenticated: false,
  usingAdminTheme: false,
  isLoading: true,
  error: null,
}

const themeStore: ThemeStoreRecord = {
  snapshot: initialSnapshot,
  listeners: new Set(),
  bootstrapPromise: null,
}

function emitThemeStore(): void {
  for (const listener of themeStore.listeners) {
    listener()
  }
}

function setThemeStoreSnapshot(
  next: ThemeStoreSnapshot | ((current: ThemeStoreSnapshot) => ThemeStoreSnapshot)
): void {
  themeStore.snapshot = typeof next === "function" ? next(themeStore.snapshot) : next
  emitThemeStore()
}

function getLocalCornerStyle(): CornerStyle | null {
  if (typeof localStorage === "undefined") return null
  const stored = localStorage.getItem("corner-style")
  return stored === "rounded" || stored === "squircle" ? stored : null
}

function applyThemeSnapshot(snapshot: ThemeSnapshot): void {
  const localCorner = getLocalCornerStyle()
  setThemeStoreSnapshot({
    ...snapshot,
    cornerStyle: localCorner ?? snapshot.cornerStyle,
    themes: Array.isArray(snapshot.themes) ? snapshot.themes : [],
    isLoading: false,
    error: null,
  })
}

/**
 * Prime den Store mit einem Server-Snapshot (Root-Layout/SSR).
 */
export function primeThemeStore(snapshot: ThemeSnapshot): void {
  applyThemeSnapshot(snapshot)
}

/**
 * Laedt den Server-Snapshot neu und broadcastet ihn an alle Abonnenten.
 */
export async function refreshThemeStore(): Promise<void> {
  try {
    const snapshot = await fetchThemeSnapshot({ forceRefresh: true })
    applyThemeSnapshot(snapshot)
  } catch (fetchError) {
    setThemeStoreSnapshot((current) => ({
      ...current,
      error: fetchError instanceof Error ? fetchError.message : "Unknown error",
      isLoading: false,
    }))
  }
}

/**
 * Admin-Operation: Setzt das App-weite Brand-Theme (synchronisiert auf alle Admins).
 */
export async function setThemeStoreTheme(themeId: string): Promise<void> {
  const result = await updateEffectiveThemeSelection({ theme: themeId })
  if (!result.success || !result.snapshot) {
    throw new Error(result.error ?? "Theme konnte nicht gesetzt werden.")
  }

  applyThemeSnapshot(result.snapshot)
}

/**
 * Admin-Operation: Setzt das App-weite Color-Scheme (synchronisiert auf alle Admins).
 */
export async function setThemeStoreColorScheme(colorScheme: ThemeColorScheme): Promise<void> {
  const result = await updateEffectiveThemeSelection({ colorScheme })
  if (!result.success || !result.snapshot) {
    throw new Error(result.error ?? "Color Scheme konnte nicht gespeichert werden.")
  }

  applyThemeSnapshot(result.snapshot)
}

/**
 * Lokal-Operation: Setzt den Corner-Style (wird per LocalStorage pro Geraet gespeichert).
 */
export function setThemeStoreCornerStyle(style: CornerStyle): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("corner-style", style)
  }
  setThemeStoreSnapshot((current) => ({
    ...current,
    cornerStyle: style,
  }))
}

function connectThemeStore(): void {
  if (typeof window === "undefined") {
    return
  }

  if (!themeStore.bootstrapPromise && themeStore.snapshot.themes.length === 0) {
    themeStore.bootstrapPromise = refreshThemeStore().finally(() => {
      themeStore.bootstrapPromise = null
    })
  }
}

function subscribeThemeStore(listener: () => void): () => void {
  themeStore.listeners.add(listener)
  connectThemeStore()

  return () => {
    themeStore.listeners.delete(listener)
  }
}

function getThemeStoreSnapshot(): ThemeStoreSnapshot {
  return themeStore.snapshot
}

function getThemeServerSnapshot(): ThemeStoreSnapshot {
  return initialSnapshot
}

/**
 * React-Hook: Subscribiert auf den ThemeStore und rendert bei Aenderung.
 */
export function useThemeStoreSnapshot(): ThemeStoreSnapshot {
  return useSyncExternalStore(subscribeThemeStore, getThemeStoreSnapshot, getThemeServerSnapshot)
}

/**
 * React-Hook: Liefert einen stabilen `refresh()`-Callback (isLoading wird gesetzt).
 */
export function useThemeStoreRefresh(): () => Promise<void> {
  return useCallback(async (): Promise<void> => {
    setThemeStoreSnapshot((current) => ({
      ...current,
      isLoading: current.themes.length === 0,
      error: null,
    }))
    await refreshThemeStore()
  }, [])
}

/**
 * Direktzugriff (ausserhalb von React, z.B. in Imperative-Handlern).
 */
export function getCurrentThemeStoreSnapshot(): ThemeStoreSnapshot {
  return themeStore.snapshot
}
