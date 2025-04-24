# Samarthanam Volunteer Dashboard

A dedicated portal for volunteers to register, manage their profiles, discover events, and participate in community activities organized by Samarthanam.

## Project Overview

The Samarthanam Volunteer Dashboard is a web application that serves as a companion to the Event Admin Dashboard. It enables volunteers to browse available events, sign up for activities, track their participation, and communicate with event organizers. The platform streamlines the volunteer management process and enhances engagement within the Samarthanam community.

## Key Features

- **User Authentication**: Secure login and registration system for volunteers
- **Interactive Onboarding**: Multi-step onboarding process to collect volunteer information
- **Event Discovery**: Browse and search for upcoming events by category and location
- **Event Registration**: Register for events and manage participation
- **Task Management**: View assigned tasks and update their status
- **Profile Management**: Update personal information, skills, and availability
- **In-Event Communication**: Chat functionality for event-specific communication
- **Feedback System**: Provide ratings and feedback for completed events

## Technologies Used

- **Frontend**:
  - Next.js 14.1.0 (React 18)
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - Lucide Icons
  - React Hook Form with Zod validation
  - Recharts for data visualization

- **Backend**:
  - Supabase for authentication and database
  - PostgreSQL database

- **Authentication**:
  - Supabase Authentication

## Installation Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Volunteer-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

The application shares the same Supabase database with the Event Admin Dashboard. The schema.sql file contains all the necessary table definitions and relationships. If you haven't already set up the database for the Event Admin Dashboard, import the schema.sql file into your Supabase project.

## Usage Instructions

1. **Registration and Onboarding**
   - New volunteers can register through the sign-up page
   - Complete the 3-step onboarding process:
     - Step 1: Personal information
     - Step 2: Skills and expertise
     - Step 3: Availability and preferences

2. **Discovering Events**
   - Browse the events catalog from the dashboard
   - Filter events by category, location, and date
   - View detailed information about each event

3. **Participating in Events**
   - Register for events of interest
   - View assigned tasks within events
   - Update task status as you progress
   - Communicate with organizers through the event chat

4. **Managing Your Profile**
   - Update your personal information
   - Modify your skills and expertise
   - Adjust availability preferences
   - View your event participation history

5. **Providing Feedback**
   - Rate completed events
   - Provide detailed feedback to event organizers
   - View your contribution history

## Contribution Guidelines

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Open a pull request

Please ensure your code follows the existing style conventions and includes appropriate tests.

## License

This project is created by team Samarthanam Saarthi VIT Pune.

## Acknowledgements

- Samarthanam Trust for the Disabled
- All contributors and developers who have worked on this project 