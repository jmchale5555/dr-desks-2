import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, BarChart3, Settings, FileText, DraftingCompass, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Navbar({ isAdmin = false, isMobileMenuOpen, onMobileMenuClose }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const prevPathRef = useRef(currentPath);

  // Close mobile menu when route actually changes
  useEffect(() => {
    if (prevPathRef.current !== currentPath) {
      onMobileMenuClose();
    }
    prevPathRef.current = currentPath;
  }, [currentPath, onMobileMenuClose]);

  const navItems = [
    {
      path: '/booking',
      label: 'Book Desk',
      icon: Calendar,
      show: true,
    },
    {
      path: '/mybooking',
      label: 'My Bookings',
      icon: FileText,
      show: true,
    },
    {
      path: '/admin',
      label: 'Admin',
      icon: LayoutDashboard,
      show: isAdmin, // Only show if admin
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      show: true,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      show: isAdmin, // Only show if admin
    },
    {
      path: '/room-builder',
      label: 'Room Builder',
      icon: DraftingCompass,
      show: isAdmin,
    },
  ];

  const isActive = (path) => currentPath === path || currentPath.startsWith(path + '/');

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Desktop navbar */}
      <nav className="hidden lg:block bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-1">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors relative
                      ${active
                        ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-50 dark:bg-gray-800 transform transition-transform duration-300 lg:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Menu</h2>
          <button
            onClick={onMobileMenuClose}
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="p-2 space-y-1">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
