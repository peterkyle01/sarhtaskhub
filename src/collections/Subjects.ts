import type { CollectionConfig } from 'payload'

const Subjects: CollectionConfig = {
  slug: 'subjects',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}

export default Subjects
