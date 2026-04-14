import './globals.css';

export const metadata = {
  title: 'JobSeek — AI Job Search Agent',
  description: 'Automated job search and application platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
