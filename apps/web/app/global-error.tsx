'use client';

import * as Sentry from '@sentry/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    Sentry.captureException(error, {
      contexts: {
        nextjs: {
          pathname,
          searchParams: searchParams?.toString(),
        },
      },
    });
  }, [error, pathname, searchParams]);

  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Something went wrong!</h2>
          <p>An error has been reported to our team.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
