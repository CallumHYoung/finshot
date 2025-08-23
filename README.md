# NetWorth Advisor

A comprehensive networth tracking application that records periodic snapshots of your financial accounts and provides insightful metrics and visualizations. Built with a tax-software style questionnaire interface for easy data entry.

## Features

### 📊 Periodic Snapshots
- Take monthly snapshots of all your financial accounts
- Track assets (checking, savings, investments, retirement, real estate, vehicles)
- Track liabilities (credit cards, loans, mortgages)
- Automatic net worth calculation

### 🧮 Advanced Metrics
- **Dollars Per Hour**: Calculate your hourly earnings by dividing monthly gains by hours in the month
- **Portfolio Change**: Track investment performance as a percentage
- **Monthly Gain/Loss**: Monitor period-over-period changes
- **Asset vs Liability Tracking**: Detailed breakdown of your financial position

### 🎯 Tax-Software Style Interface
- Guided questionnaire flow
- Step-by-step account category selection
- Easy account entry with validation
- Review screen before submission

### 📈 Data Visualization
- Interactive net worth trend charts using D3.js
- Hover tooltips with detailed information
- Responsive design for all screen sizes
- Beautiful gradient visualizations

### 🔐 Secure Authentication
- JWT-based authentication
- Encrypted password storage
- User data isolation
- Secure API endpoints

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **D3.js** for data visualization
- **Vite** for fast development and building
- **Lucide React** for icons
- Modern CSS with responsive design

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** database with custom connection layer
- **JWT** authentication
- **bcryptjs** for password hashing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd advisor
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   # Frontend (.env)
   cp .env.example .env
   
   # Backend (backend/.env)
   cd backend
   cp .env.example .env
   ```

5. **Start the development servers**
   
   Backend (runs on port 3001):
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend (runs on port 5173):
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Snapshots
- `GET /api/snapshots` - Get all user snapshots
- `GET /api/snapshots/:id` - Get specific snapshot with accounts
- `POST /api/snapshots` - Create new snapshot
- `DELETE /api/snapshots/:id` - Delete snapshot

### Categories
- `GET /api/categories` - Get all account categories

## Database Schema

### Users
- User authentication and profile information

### Snapshots
- Periodic financial snapshots with calculated metrics
- Net worth, assets, liabilities totals
- Metadata for dollars per hour, portfolio changes

### Accounts
- Individual financial accounts within each snapshot
- Linked to categories for organization

### Account Categories
- Predefined categories for organizing accounts
- Asset vs liability classification

## Metrics Calculation

### Dollars Per Hour
```
Monthly Gain ÷ Hours in Month = Dollars Per Hour
```

### Portfolio Change
```
(Investment Gain ÷ Total Investment Value) × 100 = Portfolio Change %
```

### Monthly Gain
```
Current Net Worth - Previous Net Worth = Monthly Gain
```

## Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Check TypeScript types
```

### Backend Development
```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run typecheck    # Check TypeScript types
```

## Project Structure

```
advisor/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth)
│   ├── data/              # Static data (categories)
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── backend/               # Backend source
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── database/      # Database connection & schema
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── data/              # SQLite database files
└── README.md
```

## Future Enhancements

- [ ] Account integration with banks/brokerages
- [ ] Goal setting and tracking
- [ ] Export functionality (PDF, CSV)
- [ ] Mobile app
- [ ] Advanced analytics and insights
- [ ] Recurring snapshots automation
- [ ] Multi-currency support
- [ ] Family/household accounts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.