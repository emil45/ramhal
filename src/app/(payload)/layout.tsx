import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import '@payloadcms/next/css'
import { Assistant } from 'next/font/google'
import type { ServerFunctionClient } from 'payload'
import type React from 'react'

import './admin-theme.css'
import { importMap } from './admin/importMap.js'

// Same interface font as the storefront (docs/DESIGN.md), self-hosted the
// same way — loaded here rather than assuming the frontend route group's
// font is available, since Next.js does not share fonts across route
// groups. Read by admin-theme.css as --font-body.
const assistant = Assistant({ subsets: ['hebrew', 'latin'], variable: '--font-sans' })

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} htmlProps={{ className: assistant.variable }} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
