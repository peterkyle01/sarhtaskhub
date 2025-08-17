import type { CollectionConfig } from 'payload'

const Topics: CollectionConfig = {
  slug: 'topics',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: false,
    },
  ],
}

export default Topics
