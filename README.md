# La Huella del Caminante

A web platform that showcases and promotes Latin American music events in Berlin. The project aims to connect the Latin American music community in Berlin, making it easier for both artists and audiences to discover and attend local performances.

## Features

- 📅 Event Calendar: Browse upcoming music events with date filtering
- 🎵 Genre Filtering: Find events by musical genre (tango, folklore, rock, etc.)
- 👨‍🎤 Artists: Explore artist profiles with their upcoming events
- 🔍 Search: Look up specific artists or events
- 📱 Responsive Design: Optimized for all devices

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Prisma](https://www.prisma.io/) with PostgreSQL
- **Authentication**: [Clerk](https://clerk.com/) - User authentication and management
- **Styling**:
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**:
  - [Vitest](https://vitest.dev/) - Unit and component testing
  - [Testing Library](https://testing-library.com/) - React component testing
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

4. Run the database migrations:

```bash
npx prisma migrate dev
```

5. Seed the database with initial data:

```bash
npm run prisma:seed
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Using Docker

1. Clone the repository:

```bash
git clone https://github.com/thusspokedata/lahuelladelcaminante.git
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

## Testing

The project uses Vitest and Testing Library for unit and component testing.

### Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with a UI:

```bash
npm run test:ui
```

Generate test coverage report:

```bash
npm run test:coverage
```

## Project Structure

```
src/
├── app/                # Next.js app router pages
├── components/         # Reusable React components
├── lib/                # Utility functions and configurations
├── services/           # Data access and business logic layer
├── types/              # TypeScript type definitions
├── __tests__/          # Test files
└── generated/          # Generated Prisma client
prisma/
├── migrations/         # Database migrations
└── schema.prisma       # Database schema
```
