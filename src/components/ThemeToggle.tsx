'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch – only render based on theme after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (resolvedTheme || theme) as string | undefined;
  const isDark = currentTheme === 'dark';

  if (!mounted) {
    // Render a stable skeleton button during SSR/first paint
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 shadow-lg min-h-[44px] min-w-[44px]"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 shadow-lg min-h-[44px] min-w-[44px] hover:scale-110 transition-transform"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
