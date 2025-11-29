'use client';

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

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="payment-text"
          className="block text-sm sm:text-base font-medium text-gray-700"
        >
          Paste Payment Text
        </label>
        <textarea
          id="payment-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste payment details from email, chat, SMS, or notes..."
          className="mobile-input w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors touch-manipulation"
          disabled={isLoading}
          maxLength={maxCharacters}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <span>
            {characterCount} / {maxCharacters} characters
          </span>
          {characterCount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="touch-target text-gray-600 hover:text-gray-800 active:text-gray-900 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleExtract}
          disabled={!value.trim() || isLoading}
          className="touch-target w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-blue-600 text-white text-base sm:text-lg font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[200px]"
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
        </button>
      </div>
    </div>
  );
}
