import clsx from 'clsx';

interface Props {
  children: React.ReactNode;
  color?: 'gray' | 'green' | 'yellow' | 'red' | 'blue';
}

const colorMap: Record<string, string> = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-indigo-100 text-indigo-700',
};

export const Badge = ({ children, color = 'gray' }: Props) => {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', colorMap[color])}>
      {children}
    </span>
  );
};
