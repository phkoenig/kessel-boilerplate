# Secrets Management

## 🎯 Grundprinzip: Single Source of Truth

**Alle API-Keys werden AUSSCHLIESSLICH im Supabase Vault gespeichert.**

\

### ⚠️ WICHTIG: Keine sensiblen Keys direkt in Vercel Env Vars!

API-Keys für externe Services werden **NIEMALS** direkt in Vercel oder gespeichert.
Sie werden immer zur Laufzeit aus dem Supabase Vault geladen.

---

## ⚠️ Bekannte Fallstricke und Probleme

Diese Sektion dokumentiert Probleme, über die wir gestolpert sind, und ihre Lösungen.

### 1. Externe APIs blockieren US-IPs (Vercel Region)

**Problem:**
Manche APIs (z.B. Börsen wie KuCoin, Binance) blockieren Requests aus den USA. Vercel Serverless Functions laufen standardmäßig in .

**Lösung:**
In die Region auf Frankfurt setzen:

\

### 2. Trailing Newlines in Vercel Environment Variables

**Problem:**
Mit gesetzte Variables können unsichtbare Newline-Zeichen enthalten.

**Lösung:**

\

### 3. @t3-oss/env-nextjs Validierung blockiert Build

**Lösung:**

1.  ist bereits in gesetzt
2.  Optionale Variables mit markieren

### 4. SERVICE_ROLE_KEY vs SUPABASE_SERVICE_ROLE_KEY

Wir verwenden konsistent (ohne SUPABASE\_ Prefix).
