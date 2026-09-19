export const APP_ENVIRONMENTS = ['development', 'demo', 'production'] as const

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]

/**
 * Which deployment this is — a fact about where the shop is running, kept
 * apart from NODE_ENV, which only says whether the build is optimised. A
 * deployed demo is NODE_ENV=production and APP_ENV=demo.
 *
 * Unset or unrecognised is an error, not a default: a default of
 * "development" would let a forgotten variable in a real deployment switch
 * on the mock payment provider.
 */
export function parseAppEnvironment(value: string | undefined): AppEnvironment {
  const match = APP_ENVIRONMENTS.find((environment) => environment === value)
  if (!match) {
    throw new Error(
      `APP_ENV must be one of ${APP_ENVIRONMENTS.join(', ')}; got ${value === undefined || value === '' ? 'nothing' : `"${value}"`}. See .env.example.`,
    )
  }
  return match
}

export function readAppEnvironment(): AppEnvironment {
  return parseAppEnvironment(process.env.APP_ENV)
}

/**
 * Pages are prerendered, so `APP_ENV` — and with it the demo banner — is
 * baked into the HTML at build time. A build made for one environment and
 * started as another would serve the wrong banner state to every visitor, so
 * that combination refuses to start instead.
 */
export function assertBuiltForRunningEnvironment(builtFor: string | undefined, running: AppEnvironment): void {
  if (builtFor !== running) {
    throw new Error(
      `Refusing to start: this build was made with APP_ENV "${builtFor ?? 'unset'}" but is running with APP_ENV "${running}". ` +
        'Prerendered pages carry the environment they were built for, including the demo banner. ' +
        'Run `next build` again with the APP_ENV you intend to run.',
    )
  }
}
