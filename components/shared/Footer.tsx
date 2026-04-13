import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-surface-container-low flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-16 w-full mt-auto">
      <div className="mb-8 md:mb-0">
        <img 
          src="https://www.fishndrop.com/wp-content/uploads/2026/01/cropped-logo-1-1.png" 
          alt="Fishndrop" 
          className="h-16 w-auto object-contain brightness-0 grayscale invert opacity-90"
        />
      </div>
      
      <div className="flex flex-wrap justify-center gap-8 mb-8 md:mb-0">
        <Link 
          href="#" 
          className="font-body text-[10px] tracking-widest uppercase text-secondary hover:text-on-surface transition-colors"
        >
          Privacy Policy
        </Link>
        <Link 
          href="#" 
          className="font-body text-[10px] tracking-widest uppercase text-secondary hover:text-on-surface transition-colors"
        >
          Terms of Service
        </Link>
        <Link 
          href="#" 
          className="font-body text-[10px] tracking-widest uppercase text-secondary hover:text-on-surface transition-colors"
        >
          Accessibility
        </Link>
        <Link 
          href="#" 
          className="font-body text-[10px] tracking-widest uppercase text-secondary hover:text-on-surface transition-colors"
        >
          Contact
        </Link>
      </div>

      <p className="font-body text-[10px] tracking-widest uppercase text-secondary">
        © 2024 Fishndrop. A Modern Culinary Journey.
      </p>
    </footer>
  );
};
