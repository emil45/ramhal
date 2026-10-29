import type { CollectionConfig, GlobalConfig } from 'payload'

/**
 * Hides Payload's "API" tab and URL on a collection or global. They show the
 * raw REST address of a document — meaningful to a developer, a locked door to
 * the one editor, who has no use for it. One wrapper at the config root rather
 * than the same line in seventeen files.
 */
export function hideApiUrl<Config extends CollectionConfig | GlobalConfig>(config: Config): Config {
  return { ...config, admin: { ...config.admin, hideAPIURL: true } }
}
