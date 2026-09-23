import { Forbidden } from 'payload'

import { isAdminAllowedEmail, readAdminAllowedEmails } from '../../lib/auth/adminAllowlist.ts'

import type { CollectionBeforeLoginHook } from 'payload'

/**
 * THE gate on who may ever obtain an admin session — see
 * docs/DECISIONS.md §10. Payload runs beforeLogin inside its own local
 * login operation (auth/operations/login.js), and payload-oauth2's callback
 * endpoint runs the same collection hook array before issuing a cookie, so
 * this one hook covers password login, the Google callback and REST
 * /api/users/login alike. It must not live only in the login UI or in
 * plugin options — /api/users/oauth/authorize is a URL anyone can type.
 */
export const allowOnlyListedAdmins: CollectionBeforeLoginHook = ({ user }) => {
  const allowedEmails = readAdminAllowedEmails()
  if (typeof user.email !== 'string' || !isAdminAllowedEmail(user.email, allowedEmails)) {
    throw new Forbidden()
  }
}
