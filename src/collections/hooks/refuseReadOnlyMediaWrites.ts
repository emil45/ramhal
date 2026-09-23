import { assertMediaWritable, readMediaStorageSettings } from '../../lib/mediaStorage.ts'

import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook } from 'payload'

// Without these, the storage adapter would try to write to a bucket this
// environment holds no credentials for and fail with an S3 error nobody can act
// on. Editing a media document's text fields stays allowed: only the file is
// the bucket's business.
export const refuseReadOnlyMediaUpload: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.file) assertMediaWritable(readMediaStorageSettings(process.env))
  return data
}

export const refuseReadOnlyMediaDelete: CollectionBeforeDeleteHook = () => {
  assertMediaWritable(readMediaStorageSettings(process.env))
}
