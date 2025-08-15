# Deployment Guide

This guide covers how to deploy History Rewriter Live to production.

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- OpenAI API key
- ElevenLabs API key (optional, will fallback if not provided)

## Quick Start

1. **Clone and setup:**
```bash
git clone <repository-url>
cd history-rewriter-live
npm install
```

2. **Configure environment:**
```bash
cp .env.production .env.production.local
# Edit .env.production.local with your API keys
```

3. **Deploy with Docker:**
```bash
npm run deploy
```

## Manual Deployment

### 1. Environment Configuration

Create `.env.production.local`:
```env
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=your_voice_id
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### 2. Build Application

```bash
# Build Next.js application
npm run build:prod

# Build Docker image
npm run docker:build
```

### 3. Deploy with Docker Compose

```bash
# Start all services
npm run docker:run

# Check status
docker-compose ps

# View logs
npm run docker:logs
```

### 4. Verify Deployment

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Production Considerations

### Security

1. **HTTPS Setup:**
   - Uncomment HTTPS server block in `nginx.conf`
   - Add SSL certificates to `./ssl/` directory
   - Update CORS origins in environment variables

2. **API Keys:**
   - Store in secure environment variables
   - Never commit to version control
   - Rotate regularly

3. **Rate Limiting:**
   - Configured in Nginx (10 req/min for history, 5 req/min for narration)
   - Adjust based on your needs

### Performance

1. **Scaling:**
   - Frontend runs in cluster mode (max CPU cores)
   - Backend runs 2 instances by default
   - Adjust in `ecosystem.config.js`

2. **Caching:**
   - Static assets cached for 1 year
   - Audio files cached for 1 hour
   - Configure CDN for better performance

3. **Monitoring:**
   - PM2 provides process monitoring
   - Logs stored in `./logs/` directory
   - Health checks every 30 seconds

### Resource Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB storage

**Recommended:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ storage (for audio files)

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Full deployment with all services
docker-compose up -d
```

### Option 2: PM2 (Node.js only)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 3: Manual Process Management

```bash
# Build application
npm run build

# Start frontend
npm run start:prod &

# Start backend
npm run server &
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:3001/health

# Check all services
docker-compose ps
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f history-rewriter

# PM2 logs (if using PM2)
pm2 logs
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
npm run deploy
```

### Backup

Important files to backup:
- `.env.production.local` (environment variables)
- `./logs/` (application logs)
- `./server/audio/` (generated audio files)

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change ports in `docker-compose.yml`
   - Update `NEXT_PUBLIC_API_URL` accordingly

2. **API key errors:**
   - Verify keys in `.env.production.local`
   - Check API quotas and limits

3. **Memory issues:**
   - Increase Docker memory limits
   - Adjust PM2 `max_memory_restart` setting

4. **Audio generation fails:**
   - ElevenLabs API issues → Falls back to text-only mode
   - Check API key and voice ID

### Debug Mode

```bash
# Run with debug logging
NODE_ENV=development docker-compose up

# Check container logs
docker logs history-rewriter-live-history-rewriter-1
```

### Performance Issues

1. **Slow API responses:**
   - Check OpenAI/ElevenLabs API status
   - Increase timeout values in `nginx.conf`

2. **High memory usage:**
   - Monitor with `docker stats`
   - Adjust PM2 memory limits

3. **3D rendering issues:**
   - Ensure WebGL support in browsers
   - Check for GPU acceleration

## Support

For deployment issues:
1. Check logs first: `npm run docker:logs`
2. Verify environment variables
3. Test API endpoints manually
4. Check resource usage: `docker stats`

## Security Checklist

- [ ] HTTPS enabled with valid certificates
- [ ] API keys stored securely
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Security headers configured in Nginx
- [ ] Regular security updates applied
- [ ] Monitoring and alerting set up