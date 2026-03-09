export interface AppSettingsRowLike {
  appName: string | null
  appDescription: string | null
  iconUrl: string | null
  iconVariantsJson: string | null
  iconProvider: string | null
}

export interface AppSettingsUpdateInput {
  appName?: string | undefined
  appDescription?: string | undefined
  iconUrl?: string | undefined
  iconVariantsJson?: string | undefined
  iconProvider?: string | undefined
}

const normalizeOptionalString = (value: string | undefined): string | null => {
  if (value === undefined) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const mergeAppSettingsUpdate = (
  existingSettings: AppSettingsRowLike,
  input: AppSettingsUpdateInput
): AppSettingsRowLike => {
  return {
    appName:
      input.appName === undefined
        ? existingSettings.appName
        : normalizeOptionalString(input.appName),
    appDescription:
      input.appDescription === undefined
        ? existingSettings.appDescription
        : normalizeOptionalString(input.appDescription),
    iconUrl:
      input.iconUrl === undefined
        ? existingSettings.iconUrl
        : normalizeOptionalString(input.iconUrl),
    iconVariantsJson:
      input.iconVariantsJson === undefined
        ? existingSettings.iconVariantsJson
        : normalizeOptionalString(input.iconVariantsJson),
    iconProvider:
      input.iconProvider === undefined
        ? existingSettings.iconProvider
        : normalizeOptionalString(input.iconProvider),
  }
}
