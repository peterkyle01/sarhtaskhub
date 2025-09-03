# SarhTaskHub

A comprehensive task management platform built with **Next.js 15**, **PayloadCMS 3.0**, and **PostgreSQL**. SarhTaskHub facilitates seamless collaboration between tutors, clients, and administrators in an educational environment.

## 🚀 Features

- **Multi-Role Authentication**: Support for Super Admins, Admins, Tutors, and Clients
- **Task Management**: Create, assign, and track educational tasks with scoring
- **Subject & Topic Organization**: Hierarchical organization of educational content
- **Role-Based Access Control**: Granular permissions for different user types
- **Modern UI**: Built with Tailwind CSS and Radix UI components
- **Type-Safe**: Full TypeScript support with auto-generated types
- **Cloud Storage**: Integrated Vercel Blob storage for media files
- **Responsive Design**: Mobile-first design approach

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: PayloadCMS 3.0, PostgreSQL
- **Styling**: Tailwind CSS 4.0, Radix UI
- **Storage**: Vercel Blob Storage
- **Testing**: Vitest, Playwright
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js (^18.20.2 || >=20.9.0)
- pnpm (^9 || ^10)
- PostgreSQL database
- Vercel Blob Storage token (for file uploads)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/peterkyle01/sarhtaskhub.git
   cd sarhtaskhub
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Configure the following environment variables:

   ```env
   PAYLOAD_SECRET=your_secret_key
   DATABASE_URI=postgresql://user:password@localhost:5432/sarhtaskhub
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   ```

4. **Run database migrations**

   ```bash
   pnpm payload migrate
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/superadmin

## 🐳 Docker Development

For containerized development:

1. **Start the database**

   ```bash
   docker-compose up -d
   ```

2. **Update your `.env` file**

   ```env
   DATABASE_URI=postgresql://user:password@127.0.0.1:5432/sarhtaskhub
   ```

3. **Run the application**
   ```bash
   pnpm dev
   ```

## 🏛️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (frontend)/        # Frontend routes
│   │   ├── admin/         # Admin dashboard
│   │   └── tutor/         # Tutor dashboard
│   └── (payload)/         # PayloadCMS admin
├── collections/           # PayloadCMS collections
│   ├── Admins.ts
│   ├── Clients.ts
│   ├── Tasks.ts
│   ├── Tutors.ts
│   └── ...
├── components/            # Reusable components
│   ├── custom/           # Custom components
│   └── ui/               # UI components
├── server-actions/        # Next.js server actions
└── styles/               # Global styles
```

## 👥 User Roles

- **Super Admins**: Full system access and user management
- **Admins**: Manage tutors, clients, tasks, and subjects
- **Tutors**: View and update assigned tasks, manage profile
- **Clients**: Task recipients (no authentication required)

## 📊 Collections

- **Tasks**: Educational assignments with scoring and status tracking
- **Tutors**: Authenticated educators with subject specializations
- **Clients**: Task recipients and students
- **Subjects**: Educational subjects (Math, Science, etc.)
- **Topics**: Hierarchical topic organization within subjects
- **Media**: File uploads and media management

## 🧪 Testing

- **Unit Tests**: `pnpm test`
- **E2E Tests**: `pnpm test:e2e`
- **Type Checking**: `pnpm type-check`
- **Linting**: `pnpm lint`

## 🚀 Deployment

1. **Build the application**

   ```bash
   pnpm build
   ```

2. **Start production server**
   ```bash
   pnpm start
   ```

## 📝 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run unit tests
- `pnpm payload migrate:create` - Create new migration
- `pnpm generate:types` - Generate TypeScript types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions, issues, or feature requests, please:

- Open an issue on GitHub
- Contact the development team
- Check the PayloadCMS documentation for CMS-related questions
