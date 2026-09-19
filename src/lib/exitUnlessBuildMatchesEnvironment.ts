import { assertBuiltForRunningEnvironment, readAppEnvironment } from '@/lib/appEnvironment'

/**
 * Stops the process when this build was made for a different APP_ENV than the
 * one it is starting under — same reason and same mechanism as
 * exitUnlessPaymentConfigurationIsSafe: a thrown error would leave a running
 * server answering with the wrong banner state.
 */
export function exitUnlessBuildMatchesEnvironment(): void {
  try {
    assertBuiltForRunningEnvironment(process.env.BUILT_FOR_APP_ENV, readAppEnvironment())
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
