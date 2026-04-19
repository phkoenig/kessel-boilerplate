# API-Route Klassifizierung

Einheitliche Einteilung aller API-Routen nach Schutzniveau.

## Protected (requireAuth)

- `/api/app-settings` – App-Einstellungen lesen/schreiben
- `/api/themes/list` – Theme-Liste

## Admin (requireAdmin)

- `/api/admin/*` – CRUD User, Passwort, Datenbanken
- `/api/themes/delete` – Theme löschen
- `/api/themes/edit` – Theme bearbeiten
- `/api/themes/import` – Theme importieren

## Development-Only

- `/api/debug/save-screenshot` – Screenshots speichern (NODE_ENV=development + requireAuth)
- `/api/dev/*` – Impersonate, Users (NODE_ENV-Check)

## Public

- `/api/content/datenschutz` – Impressum-Content
- `/api/content/impressum` – Datenschutz-Content
- `/api/content/public-wiki` – Öffentliches Wiki
- `/api/content/wiki` – Wiki-Content (Chat/Kontext)
- `/api/media-providers` – Media-Provider-Liste
- `/api/system/tech-stack*` – Tech-Stack-Info (teilw. Prod-deaktiviert)

## Webhook (Signatur-Prüfung)

- `/api/webhooks/clerk` – Clerk Webhooks

## User (Clerk/Supabase Auth)

- `/api/user/profile` – User-Profil
- `/api/user/theme` – Theme-/Color-Scheme-Präferenz
