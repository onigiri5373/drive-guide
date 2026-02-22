import type { RelativeDirection } from '../types/geo';

interface Props {
  direction: RelativeDirection;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<
  RelativeDirection,
  { label: string; arrow: string; bg: string; text: string }
> = {
  left: { label: '左側', arrow: '←', bg: 'bg-blue-500', text: 'text-white' },
  right: { label: '右側', arrow: '→', bg: 'bg-orange-500', text: 'text-white' },
  ahead: { label: '前方', arrow: '↑', bg: 'bg-green-500', text: 'text-white' },
  behind: { label: '後方', arrow: '↓', bg: 'bg-gray-400', text: 'text-white' },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function DirectionBadge({ direction, size = 'md' }: Props) {
  const { label, arrow, bg, text } = config[direction];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${bg} ${text} ${sizeClasses[size]}`}
    >
      <span>{arrow}</span>
      <span>{label}</span>
    </span>
  );
}
