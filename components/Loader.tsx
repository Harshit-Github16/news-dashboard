'use client';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-white/30 dark:bg-black/30">
      {/* Gradient Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-500 animate-spin" />
        <div className="absolute inset-0 rounded-full border-4 border-r-transparent border-sky-400 animate-spin [animation-delay:0.15s]" />
        <div className="absolute inset-0 rounded-full border-4 border-b-transparent border-sky-300 animate-spin [animation-delay:0.3s]" />
      </div>

      {/* Loading Text */}
      <p className="mt-6 text-blue-600 dark:text-blue-600 text-lg font-semibold tracking-wide">
        Loading the latest news, please wait...
      </p>
    </div>
  );
};

export default Loader;
