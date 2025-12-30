"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_VERSION, APP_BUILD_COMMIT, APP_ENV } from "@/config/version"
import { BOILERPLATE_NAME, BOILERPLATE_VERSION } from "@/config/boilerplate"

/**
 * SystemInfoCard
 *
 * Zeigt App-Version, Commit-SHA, Environment und Boilerplate-Informationen.
 * Wird im Admin-Dashboard verwendet.
 */
export function SystemInfoCard(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">System</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs font-medium">App-Version</dt>
            <dd className="mt-1 font-mono text-xs">
              {APP_VERSION} ({APP_BUILD_COMMIT})
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium">Environment</dt>
            <dd className="mt-1 text-xs">{APP_ENV}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground text-xs font-medium">Boilerplate</dt>
            <dd className="mt-1 font-mono text-xs">
              {BOILERPLATE_NAME}@{BOILERPLATE_VERSION}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
