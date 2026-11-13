const railwayOrigin = process.env.RAILWAY_API_ORIGIN;
if (!railwayOrigin) throw new Error('Set RAILWAY_API_ORIGIN in Vercel project environment variables.');

const backendOrigin = new URL(railwayOrigin);

if (backendOrigin.protocol !== 'https:' || backendOrigin.pathname !== '/' || backendOrigin.search || backendOrigin.hash || backendOrigin.username) {
  throw new Error('RAILWAY_API_ORIGIN must be the HTTPS Railway origin without a path.');
}

export const config = {
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  framework: 'vite',
  rewrites: [
    { source: '/api/(.*)', destination: `${backendOrigin.origin}/api/$1` },
    { source: '/(.*)', destination: '/index.html' },
  ],
};
