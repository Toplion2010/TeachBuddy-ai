# TeachBuddy.ai

**Live Demo:** [https://teachbuddy-ai.vercel.app](https://teachbuddy-ai.vercel.app)

AI-powered personalized learning platform that transforms teachers' materials into adaptive learning experiences.

## Tech Stack

- **Frontend**: Next.js 14+ with React, TypeScript
- **Styling**: Tailwind CSS (Dark Theme)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials
   - Add your OpenAI API key

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                  # Next.js App Router pages
├── components/           # React components
├── lib/                  # Utility functions and clients
├── utils/                # Helper functions
├── public/               # Static assets
└── README.md
```

## Features

- Teacher uploads learning materials
- AI generates diagnostic tests
- Student takes tests
- AI analyzes mistakes and weak topics
- AI tutor mode with personalized explanations
- Progress tracking

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
