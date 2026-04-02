import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white/80 backdrop-blur-md border-t border-neutral-200/60 py-6 mt-auto transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <p className="text-sm text-neutral-500 font-medium text-center">
                    &copy; {new Date().getFullYear()} ResQMeal. All rights reserved.
                </p>
                <p className="text-xs text-neutral-400 mt-2 hover:text-green-600 transition-colors duration-200 cursor-default text-center px-2">
                    Bridging the gap between surplus food and those in need.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
