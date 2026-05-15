# Blog REST API

A production-ready Blog REST API built with **NestJS**, **TypeScript**, **TypeORM**, and **PostgreSQL**. It includes JWT authentication, role-based access control, DTO validation, Swagger documentation, pagination, search, filtering, slug generation, users, posts, categories, and comments.

## Features

- JWT registration and login with bcrypt password hashing
- Admin/user roles with reusable `@Roles()` decorator and guards
- Users, posts, categories, and comments modules
- TypeORM PostgreSQL entities and relationships
- DTO validation with `class-validator` and `class-transformer`
- Post pagination, title/content search, category filtering, and published filtering
- Auto-generated unique slugs for posts and categories
- Author/admin authorization for post updates and deletes
- Comment author/admin authorization for comment deletes
- Swagger API documentation at `/api/docs`

## Project structure

```txt
src/
  auth/
  categories/
  comments/
  common/
    decorators/
    enums/
    guards/
    interfaces/
  config/
  posts/
  users/
  app.module.ts
  main.ts
```

## Requirements

- Node.js 20+
- PostgreSQL 14+
- npm

## Environment variables

Copy the example environment file and update values for your machine:

```bash
cp .env.example .env
```

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=blog_api
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=1d
```

## Setup

```bash
npm install
createdb blog_api
npm run start:dev
```

The API runs at `http://localhost:3000/api` and Swagger docs are available at `http://localhost:3000/api/docs`.

> `synchronize` is enabled outside production for quick local development. Use migrations before running a real production deployment.

## Common scripts

```bash
npm run start:dev   # Start with watch mode
npm run build       # Compile TypeScript
npm run start:prod  # Run compiled output
npm test            # Run unit tests
npm run lint        # Run ESLint with auto-fix
```

## API endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

Admin-only:

- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

### Posts

- `GET /api/posts`
- `GET /api/posts/:id`
- `GET /api/posts/slug/:slug`
- `POST /api/posts` authenticated
- `PATCH /api/posts/:id` author or admin
- `DELETE /api/posts/:id` author or admin

Query parameters for `GET /api/posts`:

- `page` default `1`
- `limit` default `10`, max `100`
- `search` searches title and content
- `categoryId` filters by category
- `published=true|false` filters publication status

### Categories

- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories` admin-only
- `PATCH /api/categories/:id` admin-only
- `DELETE /api/categories/:id` admin-only

### Comments

- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments` authenticated
- `DELETE /api/comments/:id` comment author or admin

## Example API requests

Register a user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jane Writer","email":"jane@example.com","password":"StrongPassword123!"}'
```

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jane@example.com","password":"StrongPassword123!"}'
```

Create a post:

```bash
TOKEN="paste-access-token-here"

curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Building a NestJS Blog API",
    "content":"This post explains how to build a modular NestJS API...",
    "excerpt":"A concise NestJS API guide.",
    "published":true,
    "categoryId":1
  }'
```

List published posts in a category that match a search term:

```bash
curl 'http://localhost:3000/api/posts?page=1&limit=10&search=nestjs&categoryId=1&published=true'
```

Add a comment:

```bash
curl -X POST http://localhost:3000/api/posts/1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"content":"Great article!"}'
```
