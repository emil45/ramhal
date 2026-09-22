import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

import { readAppEnvironment } from "./src/lib/appEnvironment";

const remoteMediaPattern = process.env.S3_PUBLIC_URL
  ? new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/**`)
  : null;

const youtubeThumbnailPattern = {
  protocol: "https" as const,
  hostname: "i.ytimg.com",
  port: "",
  pathname: "/vi/**",
  search: "",
};

const nextConfig: NextConfig = {
  // Recorded into the build so the server can refuse to start under a
  // different APP_ENV than the one its prerendered pages were built for
  // (src/lib/appEnvironment.ts). Also makes a build without APP_ENV fail here.
  env: { BUILT_FOR_APP_ENV: readAppEnvironment() },
  images: {
    // Restrict Next's image proxy to this deployment's own media bucket. Local
    // development uses same-origin files and therefore needs no remote pattern.
    remotePatterns: remoteMediaPattern
      ? [remoteMediaPattern, youtubeThumbnailPattern]
      : [youtubeThumbnailPattern],
  },
};

export default withPayload(nextConfig);
