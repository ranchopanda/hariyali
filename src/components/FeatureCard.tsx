
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
  onClick?: () => void;
}

const FeatureCard = ({ title, description, icon, className, onClick }: FeatureCardProps) => {
  return (
    <div 
      className={cn(
        "kisan-card flex flex-col items-center p-6 cursor-pointer", 
        className
      )}
      onClick={onClick}
    >
      <div className="w-14 h-14 rounded-full bg-kisan-green/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-kisan-green dark:text-kisan-gold">{title}</h3>
      <p className="text-center text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default FeatureCard;
