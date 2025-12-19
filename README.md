# Wallet Application v2.0

A comprehensive personal finance management application with multi-wallet support, custom categories, budgeting, reminders, and family wallet sharing.

## Features

- **Multi-Wallet Management**: Create and manage multiple wallets for different purposes
- **Custom Categories**: Organize transactions with personalized Income/Expense categories
- **Transaction Tracking**: Record and manage financial transactions with detailed filtering
- **Budget Management**: Set monthly budgets with visual indicators and spending alerts
- **Reminders**: Schedule payment and receivable reminders with recurring options
- **Family Wallets**: Share wallets with family members through invitation system
- **Dashboard & Reports**: Comprehensive analytics with data visualization and export
- **Data Migration**: Import legacy transaction data from previous systems
- **Security**: JWT-based authentication with role-based access control

## Technology Stack

### Backend
- **Node.js** with **Express.js** framework
- **TypeScript** for type safety
- **Neon Database** (serverless PostgreSQL) for data storage
- **@neondatabase/serverless** for database connectivity
- **Knex.js** for database migrations and queries
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **Next.js** (React framework with SSR/SSG)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Hook Form** for form handling
- **Zustand** for state management

## Project Structure

```
wallet-app/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API endpoint controllers
│   │   ├── services/        # Business logic services
│   │   ├── repositories/    # Data access layer
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API route definitions
│   │   ├── database/        # Migrations and seeds
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── config/          # Configuration files
│   ├── package.json
│   ├── tsconfig.json
│   └── knexfile.js
├── frontend/                # Next.js web application
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   ├── components/      # Reusable React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── styles/          # CSS and styling
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Neon Database account (or PostgreSQL v12 or higher)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your Neon database connection in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/wallet_app_dev?sslmode=require
   JWT_SECRET=your-super-secret-jwt-key
   ```
   
   **Note**: Get your DATABASE_URL from your Neon dashboard. It should include the SSL mode parameter.

5. Run database migrations:
   ```bash
   npm run migrate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Configure API URL in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will be available at `http://localhost:3000`

## Development

### Running Tests

Backend tests:
```bash
cd backend
npm test
```

Frontend tests:
```bash
cd frontend
npm test
```

### Database Operations

Create a new migration:
```bash
cd backend
npx knex migrate:make migration_name
```

Run migrations:
```bash
npm run migrate
```

Rollback migrations:
```bash
npm run migrate:rollback
```

### Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm start
```

## API Documentation

The API follows RESTful conventions with the following base endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/wallets` - Get user wallets
- `GET /api/transactions` - Get transactions with filtering
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/reports/*` - Various reporting endpoints

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.