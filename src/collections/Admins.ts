import type { CollectionConfig } from 'payload'

const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  fields: [
    { name: 'fullName', type: 'text', required: true },
    { name: 'phone', type: 'text' },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload your profile picture',
      },
    },
    { name: 'role', type: 'text', defaultValue: 'admin', admin: { readOnly: true } },
  ],
}

export default Admins
