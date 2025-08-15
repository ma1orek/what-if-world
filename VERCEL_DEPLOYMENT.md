# Vercel Deployment Guide

## Wdrożenie na Vercel

### 1. Przygotowanie projektu

Projekt jest już skonfigurowany do wdrożenia na Vercel:

- ✅ TypeScript errors naprawione
- ✅ API routes skonfigurowane
- ✅ `vercel.json` utworzony
- ✅ Lokalna kompilacja przechodzi

### 2. Wdrożenie na Vercel

#### Opcja A: Przez Vercel Dashboard

1. Przejdź na [vercel.com](https://vercel.com)
2. Zaloguj się lub utwórz konto
3. Kliknij "New Project"
4. Połącz z GitHub repository
5. Wybierz folder `history-rewriter-live`
6. Vercel automatycznie wykryje Next.js
7. Kliknij "Deploy"

#### Opcja B: Przez Vercel CLI

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Zaloguj się
vercel login

# Wdróż projekt
vercel

# Lub wdróż do production
vercel --prod
```

### 3. Konfiguracja zmiennych środowiskowych

Po wdrożeniu, w Vercel Dashboard:

1. Przejdź do Settings → Environment Variables
2. Dodaj następujące zmienne:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

### 4. Uwagi dotyczące wdrożenia

⚠️ **Ważne**: Ten projekt ma backend serwer, który NIE może działać na Vercel.

**Co działa na Vercel:**
- ✅ Frontend Next.js
- ✅ API routes (`/api/*`)
- ✅ Statyczne pliki
- ✅ Mapy SVG

**Co NIE działa na Vercel:**
- ❌ Backend serwer (localhost:3002)
- ❌ WebSocket connections
- ❌ Długotrwałe procesy
- ❌ Pliki audio (ograniczenia Vercel)

### 5. Alternatywne rozwiązania

#### A. Pełne wdrożenie z backendem
Użyj Docker + VPS (patrz `DEPLOYMENT.md`)

#### B. Hybrydowe wdrożenie
- Frontend na Vercel
- Backend na osobnym serwerze (Railway, Render, DigitalOcean)

#### C. Serverless backend
Przepisz backend na Vercel Functions lub AWS Lambda

### 6. Testowanie wdrożenia

Po wdrożeniu:

1. Sprawdź główną stronę
2. Przetestuj `/test-svg` - mapa powinna się załadować
3. Sprawdź `/api/rewrite-history-stream?prompt=test`

### 7. Rozwiązywanie problemów

#### Błąd: "Module not found"
```bash
npm install
npm run build
```

#### Błąd: "API route not found"
Sprawdź czy folder `pages/api` istnieje

#### Błąd: "Environment variables missing"
Dodaj zmienne w Vercel Dashboard

### 8. Następne kroki

1. **Wdróż na Vercel** - frontend będzie działał
2. **Zdecyduj o backendzie:**
   - Użyj Vercel Functions
   - Wdróż backend osobno
   - Użyj zewnętrznych API

3. **Zaktualizuj API endpoints** w kodzie jeśli backend będzie na innym serwerze

---

**Status**: ✅ Gotowe do wdrożenia na Vercel (frontend)
**Backend**: Wymaga osobnego wdrożenia
