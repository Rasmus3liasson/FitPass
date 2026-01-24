/**
 * Sentry Test Page
 *
 * This page allows you to test Sentry error tracking in the Next.js app.
 * Visit /sentry-test in your browser to trigger test errors.
 */

'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryTestPage() {
  const [status, setStatus] = useState<string>('');

  const testClientError = () => {
    try {
      setStatus('Triggering client-side error...');
      throw new Error('Test Client Error - This is a test error from Next.js client');
    } catch (error) {
      Sentry.captureException(error);
      setStatus('✅ Client error sent to Sentry! Check your Sentry dashboard.');
    }
  };

  const testClientMessage = () => {
    setStatus('Sending test message...');
    Sentry.captureMessage('Test message from Next.js client', 'info');
    setStatus('✅ Message sent to Sentry! Check your Sentry dashboard.');
  };

  const testBreadcrumb = () => {
    setStatus('Adding breadcrumb and triggering error...');
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'User clicked test button',
      level: 'info',
    });

    try {
      throw new Error('Test Error with Breadcrumb');
    } catch (error) {
      Sentry.captureException(error);
      setStatus('✅ Error with breadcrumb sent! Check Sentry for breadcrumb trail.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Sentry Test Page - Next.js</h1>

      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Configuration Status</h2>
        <p style={{ margin: '5px 0' }}>
          <strong>DSN Configured:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Yes' : '❌ No'}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Environment:</strong> {process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        <button
          onClick={testClientError}
          style={{
            padding: '15px 25px',
            fontSize: '16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Test Client-Side Error
        </button>

        <button
          onClick={testClientMessage}
          style={{
            padding: '15px 25px',
            fontSize: '16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Test Message Capture
        </button>

        <button
          onClick={testBreadcrumb}
          style={{
            padding: '15px 25px',
            fontSize: '16px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Test Breadcrumb + Error
        </button>
      </div>

      {status && (
        <div
          style={{
            padding: '15px',
            backgroundColor: status.includes('✅') ? '#d1fae5' : '#fef3c7',
            border: `1px solid ${status.includes('✅') ? '#10b981' : '#f59e0b'}`,
            borderRadius: '8px',
            marginTop: '20px',
          }}
        >
          {status}
        </div>
      )}

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>📝 Instructions</h3>
        <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>Click any button above to test Sentry integration</li>
          <li>Open your Sentry dashboard to see the captured events</li>
          <li>
            Dashboard URL:{' '}
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb' }}
            >
              https://sentry.io
            </a>
          </li>
          <li>Events should appear under your FitPass Next.js project</li>
        </ol>
      </div>
    </div>
  );
}
