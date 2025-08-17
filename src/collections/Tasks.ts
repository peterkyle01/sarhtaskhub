import type { CollectionConfig } from 'payload'

const Tasks: CollectionConfig = {
  slug: 'tasks',
  auth: false,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'tutor', type: 'relationship', relationTo: 'tutors', required: true },
    { name: 'client', type: 'relationship', relationTo: 'clients', required: true },
    { name: 'topic', type: 'relationship', relationTo: 'topics', required: true },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'score',
      type: 'number',
      min: 0,
      max: 100,
    },
  ],
  access: {
    read: ({ req }) => {
      if (!req.user) return false;
      if (req.user.collection === 'superadmins') return true;
      if (req.user.collection === 'admins') return true;
      if (req.user.collection === 'tutors') return { tutor: { equals: req.user.id } };
      return false;
    },
    create: ({ req }) => ['admins', 'superadmins'].includes(req.user?.collection || ''),
    update: ({ req }) => {
      if (!req.user) return false;
      if (['admins', 'superadmins'].includes(req.user.collection)) return true;
      if (req.user.collection === 'tutors') return { tutor: { equals: req.user.id } };
      return false;
    },
    delete: ({ req }) => req.user?.collection === 'superadmins',
  },
};

export default Tasks;
