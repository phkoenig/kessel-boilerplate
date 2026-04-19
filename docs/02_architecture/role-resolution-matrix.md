# Rollen-Auflösungs-Matrix

> Plan H-5 / M-12: Wer setzt wann welche Rolle? Zentrale Referenz fuer die
> Logik in `resolveBoilerplateProvisioningRole(...)` und alle Aufrufer.

---

## Modi

`resolveBoilerplateProvisioningRole` kennt zwei Modi:

| Mode      | Verwendet von                                                           | Verhalten                                                                                                 |
| --------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `initial` | `webhook user.created`, Erst-Provisioning                               | Bootstrap-Admin-Regel + Allowlist-Upgrade + Default `user`.                                               |
| `sync`    | `webhook user.updated`, `getAuthenticatedUser`, `GET /api/user/profile` | **Nur Allowlist-Upgrade.** Bootstrap-Regel wird nicht mehr angewandt. Bestehende Rollen bleiben erhalten. |

---

## Auflösungs-Matrix

| Existierende Rolle in Core | Email in `BOILERPLATE_ADMIN_EMAILS`? | Bootstrap-Admin? | Mode     | Resultierende Rolle                                          |
| -------------------------- | ------------------------------------ | ---------------- | -------- | ------------------------------------------------------------ |
| – (neu)                    | nein                                 | ja (erster User) | initial  | `admin` (bootstrap)                                          |
| – (neu)                    | nein                                 | nein             | initial  | `user`                                                       |
| – (neu)                    | ja                                   | beliebig         | initial  | `admin` (allowlist)                                          |
| `user`                     | ja                                   | beliebig         | sync     | `admin` (Upgrade)                                            |
| `user`                     | ja                                   | beliebig         | initial  | `admin` (Upgrade)                                            |
| `user`                     | nein                                 | beliebig         | sync     | `user` (unveraendert)                                        |
| `user`                     | nein                                 | beliebig         | initial  | `user` (unveraendert)                                        |
| `admin` / `superuser`      | beliebig                             | beliebig         | beliebig | unveraendert                                                 |
| `admin`                    | nein (entfernt)                      | beliebig         | sync     | `admin` (Demotion nur explizit via `/api/admin/update-user`) |

---

## Wer darf Rollen explizit aendern?

Nur `/api/admin/update-user` (`requireAdmin`) ruft `coreStore.upsertUser({ role })`
**ausserhalb** der Provisioning-Pipeline. Das ist der einzige Pfad fuer Demotions
(Admin → User) und manuelle Promotions zu Sonderrollen jenseits der Allowlist.

`/api/user/profile` PUT veraendert die Rolle **nicht** mehr (M-12).

---

## Konflikt: UI-Demotion + Allowlist-Eintrag gleichzeitig

Nach der UI einen Allowlist-Admin auf `user` setzen → naechster Login wird **wieder
admin** (Allowlist gewinnt). Wer einen User dauerhaft demoten will, muss ihn
vorher aus `BOILERPLATE_ADMIN_EMAILS` entfernen und das Audit-Skript laufen lassen
(`pnpm audit:allowlist`).
