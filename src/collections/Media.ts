import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
  upload: true,
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (!data.alt && data.filename) {
          // Remove extension, replace dashes/underscores, capitalize
          const name = data.filename.replace(/\.[^/.]+$/, '')
          const alt = name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          data.alt = alt
        }
        return data
      },
    ],
  },
}
