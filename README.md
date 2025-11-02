# Brain Power App

A holistic wellness application designed for seniors, featuring brain training exercises, breathing techniques, and wellness guidance.

## Features

- **Language Support**: Hebrew and English with RTL support
- **Personal Information**: User profile management with validation
- **Daily Routines**: Breathing exercises, memory games, and movement activities
- **AI Assistant**: Personalized wellness guidance
- **Goals & Challenges**: Progress tracking and goal setting
- **Health Knowledge**: Educational articles and tips
- **Accessibility**: Designed with seniors in mind

## Development

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

### Build for Production

```bash
npm run build
```

### Build for GitHub Pages

```bash
npm run build:github-pages
```

## Deployment

This app is configured for deployment to GitHub Pages at `https://yerushalmi-rl.com/brain-power-app`.

### Automatic Deployment

The app automatically deploys when changes are pushed to the `main` branch via GitHub Actions.

### Manual Deployment

1. Build the app for GitHub Pages:
   ```bash
   npm run build:github-pages
   ```

2. The built files will be in the `dist/brain-power` directory

3. Deploy these files to your GitHub Pages repository

## Configuration

- **Base URL**: `/brain-power-app/` (configured in angular.json)
- **Custom Domain**: `yerushalmi-rl.com` (configured via CNAME file)
- **Routing**: SPA routing handled via 404.html redirect

## Technology Stack

- **Angular 18**: Frontend framework
- **Ionic**: Mobile-first UI components
- **TypeScript**: Type-safe JavaScript
- **CSS3**: Modern styling with gradients and animations
- **GitHub Pages**: Static site hosting
- **GitHub Actions**: CI/CD pipeline

## License

MIT License