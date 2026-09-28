import Image from 'next/image';
import type { FC } from 'react';

const Header: FC = () => {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex items-center">
        <div className="bg-white rounded-full p-1 mr-3 flex items-center justify-center w-10 h-10">
          <Image
            src="https://placehold.co/32x32/E57A44/FFFFFF.png?text=K"
            alt="K-Extintor Logo"
            width={32}
            height={32}
            className="rounded-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">K-Extintor</h1>
      </div>
    </header>
  );
};

export default Header;