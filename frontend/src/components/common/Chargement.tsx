import clsx from 'clsx';

interface ChargementProps {
  pleinePage?: boolean;
  taille?: 'sm' | 'md' | 'lg';
  texte?: string;
}

export default function Chargement({ pleinePage, taille = 'md', texte }: ChargementProps) {
  const tailles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={clsx(
          'rounded-full border-blue-600 border-t-transparent animate-spin',
          tailles[taille]
        )}
      />
      {texte && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{texte}</p>
      )}
    </div>
  );

  if (pleinePage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {spinner}
      </div>
    );
  }

  return spinner;
}
