'use client';

import React, { useRef, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * 6-box OTP input that auto-advances on digit entry and supports paste.
 */
export default function OtpInput({ value, onChange, disabled, hasError }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  function updateDigit(index: number, digit: string) {
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join('').replace(/\s/g, ''));
  }

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(-1); // only last digit
    updateDigit(index, val);
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        updateDigit(index, '');
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateDigit(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    // Focus last filled box
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' ? '' : digits[i]}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-11 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 transition-colors
            ${hasError
              ? 'border-red-400 bg-red-50 focus:ring-red-300'
              : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
      ))}
    </div>
  );
}
