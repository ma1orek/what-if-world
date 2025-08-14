# Whatify 🌍 — AI-Powered Alternate History Timeline Generator

> Rewrite pivotal moments in history and watch an alternate timeline unfold on an interactive world map — narrated by AI.

![Whatify Demo Screenshot](./public/og/og-image.jpg)

## 🚀 Overview
**Whatify** is an AI-powered platform that lets you explore alternate histories.  
Type a "What if...?" question, and our AI engine generates:
- A branching historical timeline
- An interactive map showing ripple effects across the world
- Optional AI narration for immersive storytelling

**Example prompts:**
- *What if the Roman Empire never fell?*
- *What if Napoleon won at Waterloo?*
- *What if the Cold War turned hot in 1962?*
- *What if humans colonized Mars in the 1980s?*

## ✨ Features
- **AI-Generated Narratives**: OpenAI-powered alternate history scenarios
- **Interactive World Map**: D3.js + Three.js visualization with geographic transformations
- **Timeline Events**: Chronological list of key events and outcomes
- **Voice Narration**: AI voice-over for immersive storytelling experience
- **Mobile-First Design**: Responsive UI optimized for all devices
- **Shareable Scenarios**: Unique links for each generated timeline

## 🛠 Tech Stack
- **Frontend**: Next.js 14 + React + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes + OpenAI API
- **AI**: OpenAI GPT-4 for content generation
- **Maps**: D3.js + Three.js + GSAP animations
- **Voice**: Web Speech API for narration
- **Hosting**: Vercel
- **Domain**: whatify.world
- **Deployment**: CI/CD via GitHub

## 🤖 How We Used Kiro
We integrated **Kiro** in multiple ways during the hackathon:

### **Spec-to-Code Integration**
- Generated UI components and API route stubs directly from feature specifications
- Used Kiro agents to iterate on map interactions and animation code
- Built core gameplay loop (prompt → AI → map render) in under 48h

### **Rapid Prototyping**
- Leveraged Kiro's AI agents for rapid code generation and iteration
- Used vibe coding to refine user experience and interactions
- Integrated Kiro workflow into our development pipeline

The `.kiro/` folder in this repo contains:
- Agent sessions and context
- Feature specifications
- Generated code artifacts
- Development workflow documentation

## 📦 Installation

### Prerequisites
- Node.js >= 18
- npm or yarn
- OpenAI API key

### Quick Start
```bash
# Clone repository
git clone https://github.com/ma1orek/what-if-world.git
cd what-if-world

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Add your OPENAI_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SITE_URL=https://www.whatify.world
```

## 🧪 Testing Instructions for Hackathon Judges

**Live Demo**: https://www.whatify.world

### **How to Test:**

1. **Open the application** at the link above
2. **Enter a historical "What if..." prompt** (examples provided on homepage)
3. **Wait for AI generation** (usually 10-30 seconds)
4. **Explore the interactive timeline** and world map
5. **Enable narration** to hear AI voice-over
6. **Navigate through events** using playback controls

### **No Login Required**
- Completely public demo
- No authentication barriers
- Instant access to all features

### **Example Test Scenarios**
- "What if the Roman Empire never fell?"
- "What if Napoleon won at Waterloo?"
- "What if the Cold War turned hot in 1962?"
- "What if humans colonized Mars in the 1980s?"

## 🏗 Project Structure
```
whatify-world/
├── components/          # React components
│   ├── AnimatedMapSVG.tsx    # Interactive world map
│   ├── Timeline.tsx          # Event timeline display
│   └── Narration.tsx         # Voice narration controls
├── hooks/              # Custom React hooks
│   ├── useHistoryStream.ts   # AI content streaming
│   ├── useMapAnimation.ts    # Map animations
│   └── usePlayback.ts        # Playback controls
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   └── index.tsx       # Main application
├── public/             # Static assets
│   ├── data/           # Geographic data
│   └── og/             # Open Graph images
└── styles/             # CSS and styling
```

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Connect your GitHub repo to Vercel
# Add environment variables in Vercel dashboard
# Deploy automatically on push to main branch
```

### **Manual Deployment**
```bash
npm run build
npm start
```

## 📱 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- **Kiro Team** for the amazing AI-powered development tools
- **OpenAI** for GPT-4 API access
- **Vercel** for hosting and deployment
- **D3.js & Three.js** communities for mapping libraries

## 📞 Contact
- **Project Link**: https://github.com/ma1orek/what-if-world
- **Live Demo**: https://www.whatify.world
- **Hackathon**: Built for Kiro Hackathon 2025

---

**Built with ❤️ during the Kiro Hackathon 2025**