# StockSwap

StockSwap is a platform for OEM Powersports dealers to share and view inventory for potential transfers.

## Development

### Prerequisites

- Node.js 18+
- npm 8+

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Add your Supabase credentials to the `.env` file

### Running locally

```bash
npm run dev
```

### Building for production

```bash
npm run build
```

### Testing

```bash
npm run test
```

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD. The pipeline includes:

- Linting
- Type checking
- Building
- Pre-deployment validation
- Smoke tests
- Playwright tests
- Deployment to Netlify

### Setting up GitHub Secrets

For the CI/CD pipeline to work correctly, you need to set up the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following repository secrets:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_APP_URL`: Your application URL
- `NETLIFY_AUTH_TOKEN`: Your Netlify authentication token
- `NETLIFY_SITE_ID`: Your Netlify site ID

These secrets will be used by the GitHub Actions workflows to build and deploy your application securely.