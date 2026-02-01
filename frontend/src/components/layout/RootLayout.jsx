import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';

export default function RootLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
 
  // initialize auth system
  const { user, isAdmin } = useAuth();

  // Initialize dark mode from localStorage or system preference (only once on mount)
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedMode ? savedMode === 'true' : prefersDark;
    
    if (initialDarkMode) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []); // Empty dependency array - only run once on mount

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      // Update localStorage
      localStorage.setItem('darkMode', String(newMode));
      // Update document class
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => {
      return !prev;
    });
  }, [isMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        user={user} 
        onMenuToggle={toggleMobileMenu}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      
      <Navbar 
        isAdmin={isAdmin}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={closeMobileMenu}
      />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}
