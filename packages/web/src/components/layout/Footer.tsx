import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Links */}
          <nav className="flex items-center space-x-6">
            <Link
              to="/about"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Center Text */}
          <div className="text-sm text-muted-foreground">
            Made with love at Multiverse
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            &copy; {currentYear} Multiverse Bazaar
          </div>
        </div>
      </div>
    </footer>
  );
}
