import type { CollectionConfig } from 'payload'

// Activity logs collection to store system events (task updates, client onboarding, worker profile changes, etc.)
export const ActivityLogs: CollectionConfig = {
  slug: 'activity-logs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['createdAt', 'type', 'title', 'actor'],
    description: 'System activity and audit trail entries',
  },
  access: {
    read: ({ req: { user } }) => !!user, // allow any authenticated user; tighten if needed
    create: () => false, // created only via hooks / server logic
    update: () => false,
    delete: ({ req: { user } }) => !!user && 'role' in user && user.role === 'ADMIN',
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Task Created', value: 'task_created' },
        { label: 'Task Updated', value: 'task_updated' },
        { label: 'Task Assigned', value: 'task_assigned' },
        { label: 'Task Completed', value: 'task_completed' },
        { label: 'Client Onboarded', value: 'client_onboarded' },
        { label: 'Tutor Added', value: 'worker_added' },
        { label: 'Worker Edited', value: 'worker_edited' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'actor', type: 'relationship', relationTo: 'users', required: false },
    { name: 'task', type: 'relationship', relationTo: 'tasks', required: false },
    { name: 'client', type: 'relationship', relationTo: 'clients', required: false },
    { name: 'worker', type: 'relationship', relationTo: 'users', required: false },
    { name: 'metadata', type: 'json', required: false },
  ],
}

export default ActivityLogs
