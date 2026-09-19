import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

import { readAppEnvironment } from "./src/lib/appEnvironment";

const nextConfig: NextConfig = {
  // Recorded into the build so the server can refuse to start under a
  // different APP_ENV than the one its prerendered pages were built for
  // (src/lib/appEnvironment.ts). Also makes a build without APP_ENV fail here.
  env: { BUILT_FOR_APP_ENV: readAppEnvironment() },
};

export default withPayload(nextConfig);
