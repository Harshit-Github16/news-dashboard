const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent ">
      <div className="flex flex-col items-center space-y-4">
        {/* Custom Logo */}
        <div className="w-14 h-14 animate-spin rounded-full border-t-4 border-blue-600 border-solid"></div>

        {/* Loading Text */}
        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium tracking-wide animate-pulse">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
};

export default Loader;
