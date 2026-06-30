# Art Gallery Auction App

A full-stack art auction application with real-time bidding, user wallets, artwork uploads, auction lifecycle handling, subscription notifications, and email confirmations.

## Features

- User registration and login with JWT auth
- Artwork creation with image upload and auction dates
- Real-time bidding with Socket.io
- Wallet balance checks on bids
- Auction settlement transfers buyer coins to seller
- Buyer and seller email confirmations on sale
- Subscription alerts for auction start
- MongoDB persistence with in-memory fallback

## Project structure

- `server.js/server.js` - Express backend, Socket.io server, auction lifecycle, wallet and email logic
- `client/` - React frontend
- `config/db.js` - MongoDB connection helper
- `models/` - Mongoose models for `User` and `Artwork`
- `routes/artworkRoutes.js` - Artwork REST API and subscriptions
- `uploads/` - Uploaded artwork image storage

## Requirements

- Node.js 18+ (or compatible)
- npm
- MongoDB (optional; app falls back to in-memory storage if unavailable)

## Setup

1. Install root dependencies:
   ```bash
   npm install
   ```

2. Install client dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

## Environment variables

Create a `.env` file in the repo root to configure optional services.

Example `.env`:

```env
PORT=5000
JWT_SECRET=your_secret_key
MONGO_URI=mongodb://127.0.0.1:27017/art-gallery
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=Art Gallery <noreply@example.com>
```

If email values are not set, the app will still run but log that emails are not configured.

## Running the app

### Start backend

From the repo root:

```bash
npm start
```

### Start frontend

From `client/`:

```bash
cd client
npm start
```

The client runs on `http://localhost:3000` and talks to the backend at `http://localhost:5000`.

## Notes

- The app stores artwork images in `uploads/`.
- Auctions are driven by a cron task running every minute.
- The buyer must have enough wallet balance to place a bid.
- When an auction ends, the last bidder pays the seller and both receive email details.

## Troubleshooting

- If MongoDB is unavailable, the app uses in-memory storage and data is not persisted between restarts.
- If Socket.io fails to connect, check that the backend is running on `http://localhost:5000` and the client is configured with the same socket path.
- If emails are not sending, verify SMTP credentials and `.env` values.
