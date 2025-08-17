import type { CollectionConfig } from 'payload'

const Clients: CollectionConfig = {
  slug: 'clients',
  auth: false,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
  ],
}

export default Clients
