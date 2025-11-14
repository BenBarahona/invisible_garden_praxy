# Invisible Garden Praxy - Frontend

A modern Web3 frontend application built with Next.js 14, Material UI, and Framer Motion.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material UI (MUI)** - Modern UI component library
- **Framer Motion** - Animation library
- **Web3 Libraries** - wagmi, viem, RainbowKit, Web3Modal

## Getting Started

### Installation

```bash
cd src
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # Reusable React components
├── lib/              # Utilities and configuration
│   └── theme.ts      # MUI theme configuration
└── public/           # Static assets
```

## Features

- 🎨 Modern, responsive UI with Material UI
- 🌙 Dark mode by default
- ✨ Smooth animations with Framer Motion
- 🔐 Web3 wallet connection ready
- ⚡ Optimized performance with Next.js 14
- 📱 Mobile-responsive design
