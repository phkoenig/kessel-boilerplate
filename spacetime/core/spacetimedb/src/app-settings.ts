export interface AppSettingsRowLike {
  appName?: string | undefined
  appDescription?: string | undefined
  iconUrl?: string | undefined
  iconVariantsJson?: string | undefined
  iconProvider?: string | undefined
  themeScope?: string | undefined
  globalThemeId?: string | undefined
}

export interface AppSettingsUpdateInput {
  appName?: string | undefined
  appDescription?: string | undefined
  iconUrl?: string | undefined
  iconVariantsJson?: string | undefined
  iconProvider?: string | undefined
  themeScope?: string | undefined
  globalThemeId?: string | undefined
}

const normalizeOptionalString = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
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
    themeScope:
      input.themeScope === undefined
        ? existingSettings.themeScope
        : normalizeOptionalString(input.themeScope),
    globalThemeId:
      input.globalThemeId === undefined
        ? existingSettings.globalThemeId
        : normalizeOptionalString(input.globalThemeId),
  }
}
