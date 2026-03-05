# Clerk Migration Rollback

Falls die Clerk-Migration zurueckgesetzt werden muss.

## Vorsicht

Die Migrationen 032-035 aendern FKs und Schema irreversibel. Ein vollstaendiger Rollback erfordert:

1. **Daten-Sicherung** vor Migration
2. **Manuelles Zurueckspielen** der betroffenen Tabellen

## Betroffene Migrationen

| Migration | Aenderung                                            | Rollback                                                            |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| 032       | profiles: clerk_user_id, drop FK auth.users          | FK neu anlegen, clerk_user_id behalten oder droppen                 |
| 033       | user_tenants: FK auth.users -> profiles              | FK zurueck auf auth.users (nur wenn auth.users-Eintraege vorhanden) |
| 034       | tenants: clerk_org_id                                | Spalte droppen                                                      |
| 035       | bugs, features, feature*votes, ai*\*: FK -> profiles | FKs zurueck auf auth.users                                          |

## Rollback-Strategie

1. Vor Migration: `pg_dump` der betroffenen Schemas
2. Bei Problemen: Restore aus Dump
3. Code: Git-Revert der Auth-bezogenen Commits
