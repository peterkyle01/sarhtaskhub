import type { CollectionConfig } from 'payload'

const Superadmins: CollectionConfig = {
  slug: 'superadmins',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [{ name: 'role', type: 'text', defaultValue: 'superadmin', admin: { readOnly: true } }],
}

export default Superadmins
