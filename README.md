# EventPulse — Real-time Event Management API

Backend API for an event management platform. Users can browse events, register with capacity enforcement, and receive real-time announcements via Socket.io. Built as the graduation project for the backend track.

## Tech Stack

- **Node.js** + **Express 5**
- **MongoDB** + **Mongoose**
- **JWT** (jsonwebtoken) + **bcryptjs** for auth
- **Socket.io** for real-time announcements
- **express-validator** + **express-mongo-sanitize** + **morgan**
- **Swagger** (swagger-jsdoc + swagger-ui-express)
- **Jest** + **Supertest** + **mongodb-memory-server**
- **Vercel** (deployment) + **MongoDB Atlas** (cloud DB)

## Architecture (MVC)

```
config/       -> DB connection
models/       -> User, Category, Event, Registration, Message (Mongoose Schemas)
controllers/  -> Business logic
routes/       -> Express routers
middleware/   -> requireAuth, requireRole, errorHandler, validate
utils/        -> AppError, asyncHandler
seed.js       -> Sample data seeder
app.js        -> Express app + Socket.io + Swagger + Health
```

## Local Installation

```bash
# 1. Clone
git clone <your-repo-url>
cd 12345-EventPulse

# 2. Install
npm install

# 3. Env setup
cp .env.example .env
# Edit .env:
# PORT=3000
# NODE_ENV=development
# MONGO_URI=mongodb://127.0.0.1:27017/eventpulse  (or Atlas URI)
# JWT_SECRET=a_long_random_string_no_one_can_guess
# JWT_EXPIRES_IN=7d

# 4. Seed database (requires running MongoDB)
npm run seed
# Creates:
#  - Categories: Music, Tech, Sports, Business
#  - Admin: admin@eventpulse.com / Admin123!
#  - Attendees: sara@example.com / User123!, john@example.com / User123!
#  - 5 Events across categories
#  - Sample registrations & messages

# 5. Run dev
npm run dev
# or
npm start

# 6. Tests
npm test
```

## Seed & Run Commands

| Command | Purpose |
|---------|---------|
| `npm run seed` | Clear and populate DB with sample data |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start production server |
| `npm test` | Run Jest unit + integration tests (16 tests) |

## Environment Variables

| Key | Example | Description |
|-----|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/eventpulse` | MongoDB connection string (Atlas for production) |
| `JWT_SECRET` | `a_long_random_string` | Secret for signing JWT |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |

## API Endpoints Summary

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/health` | Health check (status, env, uptime, DB) | Public |
| `GET` | `/api-docs` | Swagger UI | Public |
| `POST` | `/api/auth/register` | Register (hash with bcrypt, 409 if email exists) | Public |
| `POST` | `/api/auth/login` | Login (returns JWT with userId+role) | Public |
| `GET` | `/api/events` | List events (filter, search, sort, paginate) | Public |
| `GET` | `/api/events/:id` | Get single event (populate category+organizer) | Public |
| `POST` | `/api/events` | Create event | Admin |
| `PATCH` | `/api/events/:id` | Update event | Admin |
| `PUT` | `/api/events/:id` | Update event (alias) | Admin |
| `DELETE` | `/api/events/:id` | Delete event | Admin |
| `POST` | `/api/registrations` | Register for event (capacity & duplicate checks) | Auth |
| `POST` | `/api/events/:id/register` | Alias for registration | Auth |
| `GET` | `/api/registrations/my` | My registrations (populate event) | Auth |
| `DELETE` | `/api/registrations/:id` | Cancel own registration | Auth |
| `DELETE` | `/api/events/:id/register` | Alias cancel | Auth |
| `GET` | `/api/events/:id/attendees` | List attendees for event | Public |
| `GET` | `/api/events/:id/status` | Capacity status | Public |
| `POST` | `/api/announcements` | Send announcement (emit to room) | Admin |
| `GET` | `/api/announcements/:eventId` | Announcement history (populate sender, sorted) | Public |
| `GET` | `/api/events/:id/announcements` | Alias history | Public |

### Query Features (GET /api/events)

- **Filtering:** `?category=ID` `?city=Cairo` `?startDate=2024-01-01&endDate=2024-12-31`
- **Search:** `?search=music` (case-insensitive regex on title + description)
- **Pagination:** `?page=1&limit=10` → response `{total, page, limit, totalPages, data}`
- **Sorting:** `?sortBy=date|registrations|createdAt&order=asc|desc` (whitelist, defaults to `date`)
- **Populate:** `category` on list, `category` + `organizer` on single

## Real-time (Socket.io)

```js
// Client
const socket = io('http://localhost:3000');
socket.emit('join-event', eventId); // join room
socket.on('announcement', (msg) => console.log(msg)); // listen

// Server emits on POST /api/announcements
io.to(eventId).emit('announcement', savedMessage);
```

Each event has its own room. Announcements are persisted via `Message` model and can be fetched via history endpoint for late joiners.

## Validation & Errors

- **express-validator** on all POST/PATCH: invalid → `422` with `{errors: [{field, msg}]}`
- **Central errorHandler** (last middleware in app.js): handles `ValidationError`→400, `CastError`→400, `11000`→409, `AppError`→custom, others→500. Stack only in `development`.

## Testing

```
tests/unit/AppError.test.js        -> 4 tests
tests/unit/asyncHandler.test.js     -> 4 tests
tests/integration/events.test.js    -> 8 tests (GET 200, 401, 422, 403, populate, filters, search, pagination)
Total: 16 passing (npm test -- --forceExit)
```

Run: `npm test`

## Swagger & Postman

- Swagger UI: `http://localhost:3000/api-docs` (and `https://your-app.vercel.app/api-docs` in production). Documents Auth & Events at minimum (method, path, body, responses).
- Postman: `postman/EventPulse.postman_collection.json` — import into Postman. Contains folders Auth, Events, Registrations, Announcements, Health & Docs with sample bodies and responses. Variables: `baseUrl`, `token`, `adminToken`, `eventId`, etc.

## Deployment

### MongoDB Atlas

1. Create account at cloud.mongodb.com → Create M0 Free cluster
2. Create Database User (username/password)
3. Network Access → Add `0.0.0.0/0`
4. Copy connection string → use as `MONGO_URI`

### Vercel

1. `vercel.json` already configured: `{version:2, builds:[{src:app.js,use:@vercel/node}], routes:[{src:/(.*),dest:app.js}]}`
2. Import GitHub repo in vercel.com → Add Env Vars: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production` → Deploy
3. Verify: `https://your-app.vercel.app/health` → `{status:"ok", database:"connected"}` and `/api-docs` loads.

## Git Workflow

```bash
git init
git add .
git commit -m "feat: task 1 project structure and models"
# ... commits per task ...
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# Open PR from feature branch to main
```

Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`.

## Live Deployment Link

- **API:** `https://your-app.vercel.app` (replace after deploy)
- **Health:** `https://your-app.vercel.app/health`
- **Docs:** `https://your-app.vercel.app/api-docs`

## Project Name

Required format: `StudentID-EventPulse` (e.g., `12345-EventPulse`). Rename folder before submission.

## License

ISC
