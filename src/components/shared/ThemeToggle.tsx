'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Toggle, { ToggleOption } from './Toggle';

type ThemeType = 'light' | 'dark';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeOptions: ToggleOption<ThemeType>[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, ariaLabel: 'Light theme' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, ariaLabel: 'Dark theme' },
  ];

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

  return (
    <Toggle
      value={resolvedTheme}
      options={themeOptions}
      onChange={handleThemeChange}
      ariaLabel="Theme toggle"
    />
  );
}
