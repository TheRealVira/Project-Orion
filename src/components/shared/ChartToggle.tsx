'use client';

import Toggle, { ToggleOption } from './Toggle';

export type ChartType = 'line' | 'bar';

interface ChartToggleProps {
  value: ChartType;
  onChange: (value: ChartType) => void;
  className?: string;
}

const chartOptions: ToggleOption<ChartType>[] = [
  { value: 'line', label: '📈 Line', ariaLabel: 'Line chart' },
  { value: 'bar', label: '📊 Bar', ariaLabel: 'Bar chart' },
];

export default function ChartToggle({ value, onChange, className = '' }: ChartToggleProps) {
  return (
    <Toggle
      value={value}
      options={chartOptions}
      onChange={onChange}
      className={className}
      ariaLabel="Chart type"
    />
  );
}
