import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AcademicProjectHub
          </div>
          <div className="text-xs text-muted-foreground">
            Project Approval System
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
