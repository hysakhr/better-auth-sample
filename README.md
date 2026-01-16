# Better Auth Sample

[Better Auth](https://www.better-auth.com/) を使った認証機能の実装サンプルです。Next.js (App Router) + Axum (Rust) の構成で、実践的な認証フローを学習できます。

## Features

- **Email/Password 認証** - 会員登録・ログイン
- **メール認証** - Resend によるメールアドレス確認
- **パスワードリセット** - メール経由でのパスワード再設定
- **Google OAuth** - ソーシャルログイン
- **セッション管理** - Cookie ベースの認証
- **バックエンド認証** - Axum での Cookie 検証
- **退会機能** - ソフトデリート + 再登録可能

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) |
| Auth | Better Auth + Drizzle Adapter |
| Backend | Axum + SeaORM |
| Database | PostgreSQL 16 |
| Email | Resend |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Rust (stable)
- Docker

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
sea-orm-cli migrate up
cargo run
```

### 3. Setup Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your credentials
pnpm install
pnpm dev
```

### 4. Access

- Frontend: http://localhost:3050
- Backend API: http://localhost:3051

## Project Structure

```
better-auth-sample/
├── frontend/                 # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Auth pages (login, register, etc.)
│   │   │   ├── (protected)/  # Protected pages (profile, settings)
│   │   │   └── api/          # API Routes
│   │   ├── components/auth/  # Auth components
│   │   ├── lib/              # Auth & DB config
│   │   └── db/               # Drizzle schema
│   └── ...
├── backend/                  # Axum App
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth middleware
│   │   └── entity/           # SeaORM entities
│   └── migration/            # Database migrations
├── docs/                     # Documentation
└── docker-compose.yml
```

## Auth Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Next.js
    participant Axum
    participant PostgreSQL

    Browser->>Next.js: 1. Login Request
    Next.js->>PostgreSQL: Verify & Create Session
    Next.js-->>Browser: 2. Set Cookie (better-auth.session_token)
    Browser->>Axum: 3. API Request (Cookie auto-sent)
    Axum->>PostgreSQL: 4. Verify Session
    PostgreSQL-->>Axum: Session Data
    Axum-->>Browser: 5. Response
```

## Environment Variables

### Frontend (.env.local)

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3050

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3050
NEXT_PUBLIC_BACKEND_URL=http://localhost:3051
```

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample
RUST_LOG=debug
SERVER_PORT=3051
FRONTEND_URL=http://localhost:3050
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/01_architecture.md) | System architecture design |
| [Better Auth Guide](docs/02_better-auth-guide.md) | Better Auth configuration guide |
| [Database Schema](docs/03_database-schema.md) | Database schema design |
| [API Specification](docs/04_api-specification.md) | API documentation |
| [Setup Guide](docs/05_setup-guide.md) | Environment setup instructions |
| [Withdraw Implementation](docs/06_withdraw-implementation.md) | Account deletion guide |

## API Endpoints

### Next.js (Port 3050)

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/sign-up/email` | Email registration |
| `POST /api/auth/sign-in/email` | Email login |
| `POST /api/auth/sign-in/social` | Google OAuth |
| `GET /api/auth/session` | Get current session |
| `POST /api/auth/sign-out` | Logout |
| `POST /api/user/withdraw` | Account deletion |

### Axum (Port 3051)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/health` | - | Health check |
| `GET /api/greeting` | Optional | Greeting (changes by auth status) |
| `GET /api/me` | Required | Current user info |

## Screenshots

### Login Page
Email/Password login with Google OAuth option.

### Profile Page
User information display with email verification status.

### Settings Page
Account settings including account deletion.

## License

MIT
