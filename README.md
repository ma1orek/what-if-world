# History Rewriter Live - Awwwards Edition

An interactive web application where users propose alternate history scenarios, and AI generates cinematic maps, timelines, narration, and illustrations in real-time.

## 🚀 Features

- **Cinematic Intro**: Fullscreen experience with fade-in animations
- **Interactive Input**: Propose "What if..." scenarios with example prompts
- **3D Animated Maps**: Three.js powered world map with morphing borders
- **Synchronized Timeline**: Vertical timeline that syncs with audio narration
- **AI-Generated Content**: OpenAI integration for historical scenarios
- **Voice Narration**: ElevenLabs TTS for documentary-style audio
- **Awwwards-Style Animations**: GSAP powered smooth transitions

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with TypeScript
- **Three.js** - 3D graphics and map rendering
- **GSAP** - Professional animations
- **D3.js** - Data visualization and geographic transformations
- **Tailwind CSS** - Utility-first styling

### Backend
- **Express.js** - Node.js web framework
- **OpenAI API** - GPT-4 for historical scenario generation
- **ElevenLabs API** - Text-to-speech narration

## 📦 Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
- `OPENAI_API_KEY` - Your OpenAI API key
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key

3. **Start development servers:**

Frontend (Next.js):
```bash
npm run dev
```

Backend (Express):
```bash
npm run dev:server
```

4. **Open the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📁 Project Structure

```
history-rewriter-live/
├── components/          # React components
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages
├── server/             # Express.js backend
├── styles/             # Global styles
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── public/             # Static assets
```

## 🎯 Usage

1. **Launch the app** and watch the cinematic intro
2. **Enter a "What if..." scenario** or click an example prompt
3. **Watch the magic happen** as AI generates:
   - Alternative history summary
   - Interactive timeline of events
   - Morphing world map with border changes
   - Documentary-style narration

## 🔧 Development

The project follows a spec-driven development approach with:
- Detailed requirements documentation
- Comprehensive design specifications
- Step-by-step implementation tasks

See `.kiro/specs/history-rewriter-live/` for complete specifications.

## 📄 License

This project is for educational and demonstration purposes.