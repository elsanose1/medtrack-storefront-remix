# Med-Track Storefront Application

This is the frontend application for Med-Track, a medication tracking and reminder system built with Remix. The application communicates with the Med-Track backend API to provide users with a seamless medication management experience.

## Features

- User authentication (login/register)
- Medication management (add, edit, delete medications)
- Reminder scheduling and notifications
- Real-time medication reminders via WebSockets
- User-friendly dashboard for tracking medications
- Responsive design for desktop and mobile devices

## Tech Stack

- [Remix](https://remix.run/) - React-based full-stack web framework
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Socket.IO Client](https://socket.io/docs/v4/client-api/) - For real-time communication
- [Axios](https://axios-http.com/) - HTTP client for API requests
- [JWT-Decode](https://github.com/auth0/jwt-decode) - For JWT token handling

## Prerequisites

Before running this application, ensure you have the following:

- Node.js (v20.0.0 or later)
- npm (v8.0.0 or later)
- Med-Track backend API running (default: http://localhost:5000)

## Setup and Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/med-track-storefront.git
cd med-track-storefront
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following variables:

```
API_URL=http://localhost:5000
WEBSOCKET_URL=http://localhost:5000
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## API Connection

This application connects to the Med-Track backend API for all functionality. Make sure the backend server is running and accessible before using this application. See the backend README for more information on setting up the API server.

## WebSocket Connection

The application connects to the backend WebSocket server for real-time medication reminders. The connection is automatically established when a user logs in and disconnected when they log out.

## Application Structure

- `/app` - Main application code
  - `/components` - Reusable UI components
  - `/routes` - Page components and route handlers
  - `/services` - API service modules for backend communication
  - `/styles` - CSS styles including TailwindCSS

## Testing Reminders

To test medication reminders:

1. Log in to the application
2. Add a medication with a reminder schedule
3. From the medication detail page, click the "Test Reminder" button
4. You should receive a real-time notification on the dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- This project is part of the Med-Track medication management system
- Special thanks to all contributors and testers
