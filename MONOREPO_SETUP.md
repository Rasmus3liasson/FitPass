# Monorepo Setup Guide - Expo + Next.js

This guide will help you create a monorepo with shared code between Expo and Next.js.

## Folder Structure

```
my-monorepo/
├── apps/
│   ├── mobile/              # Expo React Native app
│   │   ├── app/
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                 # Next.js website
│       ├── app/
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/              # Shared code for both platforms
│   │   ├── src/
│   │   │   ├── components/  # Cross-platform components
│   │   │   ├── hooks/       # Shared hooks
│   │   │   ├── utils/       # Utility functions
│   │   │   ├── types/       # TypeScript types
│   │   │   ├── api/         # API layer
│   │   │   └── config/      # Shared config
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/                  # UI components library
│   │   ├── src/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── tailwind-config/     # Shared Tailwind config
│       ├── index.js
│       └── package.json
├── backend/                 # Shared backend/API
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── package.json             # Root package.json
├── pnpm-workspace.yaml
├── tsconfig.json            # Base TypeScript config
└── turbo.json               # Turborepo config (optional)
```

## Step-by-Step Setup

### 1. Root Configuration Files

**package.json**
```json
{
  "name": "my-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "backend"
  ],
  "scripts": {
    "dev": "pnpm --parallel --filter \"./apps/*\" dev",
    "dev:mobile": "pnpm --filter mobile dev",
    "dev:web": "pnpm --filter web dev",
    "dev:backend": "pnpm --filter backend dev",
    "build": "pnpm --parallel --filter \"./apps/*\" build",
    "lint": "pnpm --parallel --filter \"./apps/*\" lint",
    "type-check": "pnpm --recursive run type-check"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "turbo": "^1.11.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**pnpm-workspace.yaml**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'backend'
```

**tsconfig.json** (Base config)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true,
    "isolatedModules": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@shared/*": ["./packages/shared/src/*"],
      "@ui/*": ["./packages/ui/src/*"]
    }
  }
}
```

### 2. Shared Package

**packages/shared/package.json**
```json
{
  "name": "@monorepo/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.3"
  }
}
```

**packages/shared/src/index.ts**
```typescript
// Export all shared code
export * from './types';
export * from './hooks';
export * from './utils';
export * from './api';
export * from './config';
```

**packages/shared/src/types/index.ts**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

// Add all your shared types here
```

**packages/shared/src/hooks/useAuth.ts**
```typescript
import { useState, useEffect } from 'react';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Your auth logic here
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Login logic
  };

  const logout = async () => {
    // Logout logic
  };

  return { user, loading, login, logout };
}
```

**packages/shared/src/utils/index.ts**
```typescript
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString();
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Add all shared utilities
```

**packages/shared/src/api/client.ts**
```typescript
import type { ApiResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    const data = await response.json();
    return { data, status: response.status };
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return { data, status: response.status };
  }

  // Add other methods (put, delete, etc.)
}

export const api = new ApiClient();
```

### 3. Shared Tailwind Config

**packages/tailwind-config/package.json**
```json
{
  "name": "@monorepo/tailwind-config",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "tailwindcss": "^3.4.0"
  }
}
```

**packages/tailwind-config/index.js**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        background: '#ffffff',
        surface: '#f8fafc',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 4. Mobile App (Expo)

**apps/mobile/package.json**
```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "@monorepo/ui": "workspace:*",
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "nativewind": "^4.0.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "typescript": "^5.3.3"
  }
}
```

**apps/mobile/tsconfig.json**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@shared/*": ["../../packages/shared/src/*"],
      "@ui/*": ["../../packages/ui/src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**apps/mobile/tailwind.config.js**
```javascript
const sharedConfig = require('@monorepo/tailwind-config');

module.exports = {
  ...sharedConfig,
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
};
```

**apps/mobile/app/_layout.tsx**
```typescript
import { Stack } from 'expo-router';
import '../global.css';

export default function RootLayout() {
  return <Stack />;
}
```

**apps/mobile/app/index.tsx**
```typescript
import { View, Text } from 'react-native';
import { useAuth } from '@monorepo/shared';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-textPrimary text-2xl font-bold">
        Mobile App
      </Text>
      {loading ? (
        <Text className="text-textSecondary">Loading...</Text>
      ) : (
        <Text className="text-textSecondary">
          {user ? `Hello, ${user.name}` : 'Not logged in'}
        </Text>
      )}
    </View>
  );
}
```

### 5. Web App (Next.js)

**apps/web/package.json**
```json
{
  "name": "web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "@monorepo/ui": "workspace:*",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
```

**apps/web/tsconfig.json**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@shared/*": ["../../packages/shared/src/*"],
      "@ui/*": ["../../packages/ui/src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**apps/web/tailwind.config.js**
```javascript
const sharedConfig = require('@monorepo/tailwind-config');

module.exports = {
  ...sharedConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

**apps/web/app/layout.tsx**
```typescript
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My App',
  description: 'Shared monorepo app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**apps/web/app/page.tsx**
```typescript
'use client';

import { useAuth } from '@monorepo/shared';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-textPrimary text-4xl font-bold">
        Web App
      </h1>
      {loading ? (
        <p className="text-textSecondary">Loading...</p>
      ) : (
        <p className="text-textSecondary">
          {user ? `Hello, ${user.name}` : 'Not logged in'}
        </p>
      )}
    </main>
  );
}
```

### 6. Shared UI Components

**packages/ui/package.json**
```json
{
  "name": "@monorepo/ui",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.3"
  }
}
```

**packages/ui/src/button/Button.tsx**
```typescript
import React from 'react';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

// Platform-agnostic button component
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  className = '',
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-semibold';
  const variantStyles = variant === 'primary'
    ? 'bg-primary-500 text-white'
    : 'bg-surface text-textPrimary';

  return (
    <button
      onClick={onPress}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {title}
    </button>
  );
};
```

**packages/ui/src/index.ts**
```typescript
export { Button } from './button/Button';
// Export all UI components
```

### 7. Backend

**backend/package.json**
```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "src/server.ts",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**backend/src/server.ts**
```typescript
import express from 'express';
import cors from 'cors';
import type { User } from '@monorepo/shared';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/users/:id', (req, res) => {
  const user: User = {
    id: req.params.id,
    email: 'user@example.com',
    name: 'John Doe',
  };
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

## Installation Steps

1. **Create the folder structure** as shown above

2. **Install pnpm** (if not already installed):
```bash
npm install -g pnpm
```

3. **Initialize the monorepo**:
```bash
cd my-monorepo
pnpm install
```

4. **Run everything**:
```bash
# Run mobile app
pnpm dev:mobile

# Run web app
pnpm dev:web

# Run backend
pnpm dev:backend

# Or run all in parallel
pnpm dev
```

## Key Benefits

✅ **Shared types** - One source of truth for TypeScript types
✅ **Shared hooks** - Reuse business logic across platforms
✅ **Shared API layer** - Same data fetching code everywhere
✅ **Shared Tailwind config** - Consistent styling
✅ **Type safety** - Full TypeScript support across the monorepo
✅ **Fast development** - Changes in shared code reflect immediately
✅ **Organized code** - Clear separation of concerns

## Environment Variables

Create `.env` files in each app:

**apps/mobile/.env**
```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**apps/web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Platform-Specific Code

When you need platform-specific implementations:

```typescript
// packages/shared/src/utils/storage.ts
export const storage = {
  set: async (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      // Web
      localStorage.setItem(key, value);
    } else {
      // React Native
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  },
  get: async (key: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
};
```

This setup gives you a complete, production-ready monorepo! 🚀
