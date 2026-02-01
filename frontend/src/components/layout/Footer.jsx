export default function Footer() {
    const currentYear = new Date().getFullYear();
  
    return (
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Left: Copyright */}
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &copy; {currentYear} Dr Desk Booking System.
              </p>
            </div>
  
            {/* Right: Links */}
            <div className="flex items-center gap-6">
              <a
                href="/privacy"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/support"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
  
          {/* Bottom: Additional info on mobile */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 sm:hidden">
            <p className="text-xs text-center text-gray-500 dark:text-gray-500">
              Built with React & Django
            </p>
          </div>
        </div>
      </footer>
    );
  }
  