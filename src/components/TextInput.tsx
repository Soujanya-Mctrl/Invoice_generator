'use client';

import { useState } from 'react';
import { INVOICE_FORMAT_EXAMPLE } from '@/lib/extraction/format-template';
import { Button } from '@/components/ui/button';

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  onExtract: () => void;
  isLoading: boolean;
}

/**
 * TextInput Component
 * 
 * Accepts payment text from user with a large textarea, character count,
 * extract button with loading state, and clear button.
 * 
 * Requirements: 1.1
 */
export default function TextInput({
  value,
  onChange,
  onExtract,
  isLoading,
}: TextInputProps) {
  const [showExample, setShowExample] = useState(false);
  const characterCount = value.length;
  const maxCharacters = 10000; // Reasonable limit for payment text

  const handleClear = () => {
    onChange('');
  };

  const handleExtract = () => {
    if (value.trim() && !isLoading) {
      onExtract();
    }
  };

  const handleUseExample = () => {
    onChange(INVOICE_FORMAT_EXAMPLE);
    setShowExample(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="payment-text"
            className="block text-sm sm:text-base font-medium text-foreground"
          >
            Payment Text
          </label>
          <button
            type="button"
            onClick={() => setShowExample(!showExample)}
            className="text-xs sm:text-sm text-primary hover:text-primary/80 underline"
          >
            {showExample ? 'Hide' : 'Show'} Format Example
          </button>
        </div>

        {showExample && (
          <div className="bg-secondary/40 dark:bg-secondary border border-border rounded-lg p-3 sm:p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  Simple Format (Recommended)
                </p>
                <p className="text-xs text-muted-foreground">
                  Use this format for best extraction results:
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseExample}
                className="text-xs sm:text-sm px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Use Example
              </button>
            </div>
            <pre className="text-xs sm:text-sm bg-card p-3 rounded border border-border overflow-x-auto">
              {INVOICE_FORMAT_EXAMPLE}
            </pre>
            <p className="text-xs text-muted-foreground">
              💡 Tip: You can also paste free-form text, and we'll try to extract the information automatically!
            </p>
          </div>
        )}

        <textarea
          id="payment-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Client: Ankit Sharma
Company: Tech Solutions
Email: ankit@example.com
Phone: 9876543210
Address: Mumbai, India

Items:
- Logo redesign: ₹3,200
- Website banner: ₹4,500

Due Date: 12th March 2025`}
          className="mobile-input w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 text-sm border border-input rounded-lg bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-y transition-colors touch-manipulation"
          disabled={isLoading}
          maxLength={maxCharacters}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>
            {characterCount} / {maxCharacters} characters
          </span>
          {characterCount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="touch-target text-muted-foreground hover:text-foreground active:text-foreground underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          onClick={handleExtract}
          disabled={!value.trim() || isLoading}
          size="lg"
          className="touch-target w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 min-w-[200px]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Extracting...
            </span>
          ) : (
            'Extract Invoice Data'
          )}
        </Button>
      </div>
    </div>
  );
}
