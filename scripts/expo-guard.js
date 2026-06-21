console.error(`
ERROR: Do not run Expo from the project root.

This folder is the Next.js web app, not the mobile app.

To start the iPhone app, run:
  npm run mobile

Or:
  cd mobile
  npm start
`);

process.exit(1);
