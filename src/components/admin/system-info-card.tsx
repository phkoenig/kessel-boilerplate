"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_BUILD_COMMIT, APP_BUILD_GENERATED_AT, APP_ENV, APP_VERSION } from "@/config/version"
import { BOILERPLATE_NAME, BOILERPLATE_VERSION } from "@/config/boilerplate"

/**
 * Verdichtet die wichtigsten Release- und Versionsinformationen fuer Admins.
 * Die Karte trennt bewusst zwischen App-Version und Boilerplate-Basis, damit
 * das Dashboard eine verlaessliche Betriebsuebersicht liefert.
 *
 * @returns Eine Karte mit Release-, Build- und Versionsmetadaten.
 */
export function SystemInfoCard(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Release und Versionen</CardTitle>
        <CardDescription>
          Kompakte Uebersicht ueber den aktuellen App-Stand und die zugrunde liegende
          Boilerplate-Basis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs font-medium">App-Version</dt>
            <dd className="mt-1 font-mono text-sm">{APP_VERSION}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium">Commit</dt>
            <dd className="mt-1 font-mono text-sm">{APP_BUILD_COMMIT}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium">Environment</dt>
            <dd className="mt-1 text-sm">{APP_ENV}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium">Build-Metadaten</dt>
            <dd className="mt-1 font-mono text-sm">{APP_BUILD_GENERATED_AT}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium">Boilerplate-Basis</dt>
            <dd className="mt-1 font-mono text-sm">
              {BOILERPLATE_NAME}@{BOILERPLATE_VERSION}
            </dd>
          </div>
        </dl>

        <div className="bg-muted/30 rounded-lg border p-4 text-sm">
          <p className="font-medium">Semantik</p>
          <p className="text-muted-foreground mt-1">
            Die App-Version beschreibt den aktuellen Release-Stand dieser Anwendung. Die
            Boilerplate-Version beschreibt den Stand der zugrunde liegenden Kessel-Basis.
          </p>
        </div>

        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs font-medium">Release-Doku</dt>
            <dd className="mt-1 font-mono text-xs">docs/06_history/CHANGELOG.md</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium">Versioning-Guide</dt>
            <dd className="mt-1 font-mono text-xs">docs/04_knowledge/app-versioning.md</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium">Quellen</dt>
            <dd className="mt-1 text-xs">
              App-Versionen kommen aus Git-Tag oder <span className="font-mono">package.json</span>.
              Die Boilerplate-Basis kommt aus <span className="font-mono">boilerplate.json</span>.
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
