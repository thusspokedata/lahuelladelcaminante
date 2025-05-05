# Deployment Guide for La Huella del Caminante

This guide will help you deploy the application using Dokku, a self-hosted PaaS solution.

## Prerequisites

- A server with Dokku installed ([Dokku installation guide](https://dokku.com/docs/getting-started/installation/))
- SSH access to your server
- Git installed on your local machine
- Docker installed on your server

## Setup Dokku App

First, SSH into your Dokku server and create a new application:

```bash
# On your Dokku server
dokku apps:create lahuelladelcaminante
```

## Configure Environment Variables

Set up environment variables for your application. Make sure to replace the placeholder values with your actual values:

```bash
# On your Dokku server
dokku config:set lahuelladelcaminante NODE_ENV=production
dokku config:set lahuelladelcaminante DATABASE_URL=your_database_url
dokku config:set lahuelladelcaminante CLERK_SECRET_KEY=your_clerk_secret_key
dokku config:set lahuelladelcaminante CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
dokku config:set lahuelladelcaminante NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
dokku config:set lahuelladelcaminante NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
dokku config:set lahuelladelcaminante NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
dokku config:set lahuelladelcaminante NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
dokku config:set lahuelladelcaminante NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
# Add all other environment variables your app needs
```

## Database Setup

If you're using a PostgreSQL database:

```bash
# On your Dokku server
dokku postgres:create lahuelladelcaminante-db
dokku postgres:link lahuelladelcaminante-db lahuelladelcaminante
```

## Set Up Domain

Set up a custom domain for your application:

```bash
# On your Dokku server
dokku domains:add lahuelladelcaminante your-domain.com
```

## SSL Setup (Optional but recommended)

Set up SSL for your application:

```bash
# On your Dokku server
dokku letsencrypt:enable lahuelladelcaminante
```

## Deployment

Add Dokku as a remote to your Git repository and push to deploy:

```bash
# On your local machine
git remote add dokku dokku@your-dokku-server:lahuelladelcaminante
git push dokku main
```

If you're deploying from a branch other than main:

```bash
# On your local machine
git push dokku feature/dashboard-event-management:main
```

## Scaling (Optional)

If you need to scale your application:

```bash
# On your Dokku server
dokku ps:scale lahuelladelcaminante web=2
```

## Logs

To check logs:

```bash
# On your Dokku server
dokku logs lahuelladelcaminante -t
```

## Troubleshooting

If your application fails to deploy, check the logs for errors:

```bash
# On your Dokku server
dokku logs lahuelladelcaminante
```

To restart your application:

```bash
# On your Dokku server
dokku ps:restart lahuelladelcaminante
```

To rebuild your application:

```bash
# On your Dokku server
dokku ps:rebuild lahuelladelcaminante
```
