// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { migrations } from './migrations'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Clients } from './collections/Clients'
import { Tutors } from './collections/Tutors'
import { Tasks } from './collections/Tasks'
import { ActivityLogs } from './collections/ActivityLogs'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Clients, Tutors, Tasks, ActivityLogs],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: {
          prefix: process.env.NODE_ENV === 'production' ? 'sartaskhub' : 'sartaskhub-dev',
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
