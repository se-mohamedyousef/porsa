# 📊 Porsa - EGX Portfolio Tracker

A modern, feature-rich portfolio tracker for the Egyptian Stock Market (EGX) built with Next.js 15, React 19, and Tailwind CSS.

![Porsa Portfolio Tracker](https://img.shields.io/badge/Next.js-15.4.5-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 📈 Portfolio Management

- **Real-time Stock Tracking**: Monitor your EGX portfolio with live price updates
- **Profit/Loss Calculation**: Automatic P&L calculations with percentage gains
- **Portfolio Summary**: Comprehensive overview with total invested, current value, and performance metrics
- **File-based Storage**: Reliable data persistence using JSON files instead of localStorage

### 🔐 User Authentication

- **Secure Login System**: Phone and password-based authentication
- **User Registration**: Create new accounts with Phone validation
- **Session Management**: Automatic login persistence across browser sessions
- **User-Specific Data**: All portfolio and profile data is isolated per user
- **Logout Functionality**: Secure logout with session cleanup
- **NoSQL Database**: Vercel KV (Redis) for scalable data storage

### 👤 User Profile

- **Phone Number Management**: Add and manage your phone number with validation
- **Name Field**: Store your name for personalization
- **User-Specific Storage**: Profile data is saved per user account
- **Egyptian Phone Format**: Automatic formatting for Egyptian phone numbers (e.g., 010-123-4567)

### 🧮 Stock Calculator

- **Quick Calculations**: Calculate potential profits for any stock
- **Real-time Prices**: Fetch current market prices from reliable sources
- **Easy Input**: Simple form for symbol, quantity, and buy price

### 🎨 Modern UI/UX

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Smooth Animations**: Polished interactions and loading states
- **Accessibility**: Built with accessibility best practices

### 🔧 Technical Features

- **Next.js 15**: Latest framework with App Router and Turbopack
- **React 19**: Cutting-edge React features and performance
- **TypeScript**: Full type safety and better development experience
- **Tailwind CSS 4**: Modern styling with design system
- **API Routes**: RESTful API for data management
- **Error Handling**: Robust error handling and user feedback

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/porsa.git
   cd porsa
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
porsa/
├── app/
│   ├── api/
│   │   └── portfolio/          # Portfolio data API routes
│   ├── components/
│   │   ├── PortfolioTracker.jsx    # Main portfolio component
│   │   └── PortfolioSummary.jsx    # Portfolio statistics
│   ├── hooks/
│   │   └── usePortfolio.js         # Portfolio data management hook
│   ├── globals.css              # Global styles and design system
│   ├── layout.tsx               # Root layout with metadata
│   └── page.tsx                 # Main dashboard page
├── data/                        # Data storage directory
│   └── portfolio.json           # Portfolio data file
├── public/                      # Static assets
└── package.json                 # Dependencies and scripts
```

## 🎯 Usage

### Getting Started

1. **Create Account**: Click "Sign up" to create a new account
2. **Login**: Enter your Phone and password to access your account
3. **Session Persistence**: Your login will be remembered across browser sessions

### Adding Stocks to Portfolio

1. Navigate to the **Portfolio** tab
2. Enter the stock symbol (e.g., COMI, CIB, etc.)
3. Enter the quantity of shares
4. Enter your buy price per share
5. Click "Add Stock" to add to your portfolio

### Managing Your Profile

1. Click "Edit" in the User Profile section
2. Enter your name (optional)
3. Enter your phone number (Egyptian format supported)
4. Click "Save" to store your information
5. Your profile data is saved to your specific user account

### Using the Calculator

1. Navigate to the **Calculator** tab
2. Enter stock details (symbol, quantity, buy price)
3. Click "Calculate Profit/Loss" to see results

### Managing Your Portfolio

- **Refresh Prices**: Click the refresh button to update all stock prices
- **Remove Stocks**: Click the trash icon to remove stocks from your portfolio
- **View Summary**: See portfolio statistics in the summary cards

## 🔧 Configuration

### Environment Variables

For local development, create a `.env.local` file in the root directory:

```env
# Vercel KV Database (for production)
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

**Note**: For production deployment on Vercel, these environment variables will be automatically configured when you connect your KV database.

### Data Storage

- **NoSQL Database**: Vercel KV (Redis) for all data storage
- **User Accounts**: Stored in KV database with phone-based lookup
- **User Sessions**: Session data with automatic expiry (7 days)
- **Portfolio Data**: User-specific portfolio storage in KV
- **Profile Data**: User profile information stored in KV
- **Scalable Architecture**: Cloud-based NoSQL storage for production

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style

- **ESLint**: Configured for Next.js and React best practices
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking enabled

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on every push

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing framework
- **Vercel**: For hosting and deployment
- **Tailwind CSS**: For the utility-first CSS framework
- **EGX**: Egyptian Stock Exchange for market data

## 📞 Support

If you have any questions or need help:

- Open an issue on GitHub
- Check the documentation
- Contact the maintainers

---

Made with ❤️ for the Egyptian Stock Market community
