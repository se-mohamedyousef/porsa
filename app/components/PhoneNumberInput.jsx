"use client";

import { useState } from "react";

export default function PhoneNumberInput({
  value,
  onChange,
  placeholder = "Phone Number",
}) {
  const [isValid, setIsValid] = useState(true);

  const formatPhoneNumber = (input) => {
    // Remove all non-digits
    const cleaned = input.replace(/\D/g, "");

    // Format as Egyptian phone number
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    }
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    // Egyptian phone numbers are typically 10-11 digits
    return cleaned.length >= 10 && cleaned.length <= 11;
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    const valid = validatePhoneNumber(formatted);

    setIsValid(valid);
    onChange(formatted);
  };

  return (
    <div className="w-full max-w-full sm:max-w-md mx-auto">
      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
        Phone Number
      </label>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder || "e.g. 010-123-4567"}
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
          isValid ? "border-input bg-background" : "border-red-500 bg-red-50"
        } transition-colors`}
        style={{
          fontSize: "16px", // Ensures iOS zooms less on input
        }}
      />
      {!isValid && value && (
        <p className="text-xs sm:text-sm text-red-500 mt-1">
          Please enter a valid Egyptian phone number (10-11 digits)
        </p>
      )}
    </div>
  );
}
