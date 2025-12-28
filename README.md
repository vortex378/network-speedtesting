# Internet Speed Test

A production-ready Internet Speed Test web application similar to Speedtest by Ookla and Fast.com. This application measures real download speed, upload speed, ping, and jitter using actual network traffic.

## Features

- **Real Network Measurements**: Uses actual data transfer, not simulated values
- **Download Speed Test**: Streams 100MB of random binary data with chunked transfer encoding
- **Upload Speed Test**: Uploads 30MB of random binary data with real-time progress tracking
- **Ping & Jitter**: Measures latency and calculates jitter using standard deviation
- **Real-time Charts**: Live updating line graphs showing speed over time
- **Modern UI**: Beautiful, responsive design with dark mode support
- **Web Workers**: Speed calculations run in Web Workers to prevent UI freezing
- **Production Ready**: Proper error handling, CORS configuration, and graceful shutdown

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (for real-time charts)
- Web Workers (for speed calculations)

### Backend
- Node.js 20+
- Express.js
- TypeScript
- CORS handling
- Streaming support for efficient data transfer

## Project Structure

```
speedtest/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── workers/       # Web Workers
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # Express backend API
│   ├── src/
│   │   └── index.ts   # Main server file
│   └── package.json
├── package.json       # Root package.json for monorepo
└── README.md
```

## Speed Calculation

The application calculates internet speed using the standard formula:

```
Speed (Mbps) = (Bytes × 8 bits/byte) / (Time in seconds × 1,000,000 bits/Mbps)
```

### Download Speed
- Backend streams random binary data (100MB default, configurable 50-200MB)
- Frontend measures bytes received and elapsed time in real-time
- Updates every 100-200ms for smooth UI updates
- Uses chunked transfer encoding with cache disabled

### Upload Speed
- Frontend generates random binary data (30MB)
- Uploads via POST request with progress tracking
- Measures bytes sent and elapsed time
- Updates every 100-200ms

### Ping & Jitter
- Sends 15 ping requests to the server
- Calculates average latency
- Jitter is calculated as the standard deviation of latencies
- Formula: `jitter = √(Σ(latency - avg)² / n)`

## Installation

### Prerequisites
- Node.js 20 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd speedtest
```

2. Install all dependencies:
```bash
npm run install:all
```

Or install manually:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

## Running Locally

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Backend** (runs on http://localhost:3001):
```bash
npm run dev:backend
```

**Frontend** (runs on http://localhost:5173):
```bash
npm run dev:frontend
```

The frontend is configured to proxy API requests to the backend automatically.

### Production Build

Build both applications:
```bash
npm run build
```

Start the backend:
```bash
cd backend
npm start
```

The frontend build output will be in `frontend/dist/` and can be served by any static file server.

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### Test Parameters

You can adjust test parameters in `frontend/src/hooks/useSpeedTest.ts`:
- `PING_COUNT`: Number of ping requests (default: 15)
- `DOWNLOAD_SIZE`: Download test size in bytes (default: 100MB)
- `UPLOAD_SIZE`: Upload test size in bytes (default: 30MB)

## Deployment

### Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Navigate to frontend directory:
```bash
cd frontend
```

3. Deploy:
```bash
vercel
```

4. Set environment variable in Vercel dashboard:
   - `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.herokuapp.com`)

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `PORT`: 3001 (or let Render assign it)
     - `FRONTEND_URL`: Your frontend URL (e.g., `https://your-app.vercel.app`)

### Alternative Backend Deployment (Railway, Heroku, etc.)

The backend is a standard Express.js application and can be deployed to any Node.js hosting platform:

1. Set `PORT` environment variable (most platforms set this automatically)
2. Set `FRONTEND_URL` to your frontend domain
3. Ensure the platform supports Node.js 20+

### CORS Configuration

The backend is configured to accept requests from the frontend URL specified in `FRONTEND_URL`. Make sure this matches your deployed frontend URL.

## How It Works

### Download Test Flow

1. Frontend initiates download request with desired size
2. Backend generates random binary data on-the-fly
3. Backend streams data in 64KB chunks using chunked transfer encoding
4. Frontend reads stream using ReadableStream API
5. Frontend measures bytes received and elapsed time
6. Speed calculated in Web Worker to prevent UI blocking
7. UI updates every 100-200ms with current speed
8. Chart displays speed over time

### Upload Test Flow

1. Frontend generates random binary data (Blob)
2. Frontend creates ReadableStream with progress tracking
3. Data uploaded via POST request
4. Frontend tracks bytes sent and elapsed time
5. Speed calculated in real-time
6. Backend receives and acknowledges upload
7. Chart displays upload speed over time

### Ping Test Flow

1. Frontend sends 15 sequential GET requests to `/api/ping`
2. Each request measures round-trip time using `performance.now()`
3. Backend responds immediately with timestamp
4. Frontend calculates average latency
5. Frontend calculates jitter (standard deviation of latencies)

## Performance Considerations

- **Random Data**: All payloads use random binary data to prevent caching
- **Cache Disabled**: All requests include cache-busting headers
- **Streaming**: Download uses chunked transfer encoding for efficient memory usage
- **Web Workers**: Speed calculations run off the main thread
- **Concurrent Users**: Backend handles multiple concurrent requests safely

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires support for:
  - Fetch API with streaming
  - ReadableStream API
  - Web Workers
  - ES2020 features

## Troubleshooting

### Backend won't start
- Ensure Node.js 20+ is installed: `node --version`
- Check if port 3001 is available
- Verify all dependencies are installed: `cd backend && npm install`

### Frontend can't connect to backend
- Check `VITE_API_URL` environment variable
- Verify backend is running on the correct port
- Check CORS configuration in backend

### Speed test shows 0 Mbps
- Check browser console for errors
- Verify network connection
- Ensure backend is accessible from frontend domain

### Charts not updating
- Check browser console for errors
- Verify Web Workers are supported
- Check that data is being received

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please ensure:
- TypeScript code follows strict type checking
- No `any` types are used
- Error handling is comprehensive
- Code is properly formatted

## Acknowledgments

Inspired by Speedtest by Ookla and Fast.com. Built with modern web technologies for accurate, real-time internet speed measurements.

