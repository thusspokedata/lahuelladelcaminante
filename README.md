# La Huella del Caminante

A web platform that showcases and promotes Argentine music events in Berlin. The project aims to connect the Argentine music community in Berlin, making it easier for both artists and audiences to discover and attend local performances.

## Features

- 📅 Event Calendar: Browse upcoming Argentine music events
- 🎵 Genre Filtering: Find events by musical genre (tango, folklore, rock, etc.)
- 🔍 Search: Look up specific artists or venues
- 👤 User Authentication: Create an account to save favorite events
- 📱 Responsive Design: Optimized for all devices

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Prisma](https://www.prisma.io/) with PostgreSQL
- **Styling**: 
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Container**: [Docker](https://www.docker.com/)

## Getting Started

### Using npm

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lahuelladelcaminante.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=your_database_url
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Using Docker

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lahuelladelcaminante.git
```

2. Create a `.env` file as described above.

3. Build and run the Docker containers:
```bash
docker-compose up --build
```

This will start:
- The Next.js application on port 3000
- PostgreSQL database on port 5432

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/         # Reusable React components
├── lib/               # Utility functions and configurations
└── prisma/            # Database schema and migrations
```

