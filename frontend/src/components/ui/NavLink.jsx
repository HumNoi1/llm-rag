// frontend/src/components/ui/NavLink.jsx
"use client";

import Link from 'next/link';

// Button Link ที่มีสไตล์เหมือนปุ่ม primary
export function PrimaryButtonLink({ href, className, children, ...props }) {
  return (
    <Link 
      href={href} 
      className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

// Button Link ที่มีสไตล์เหมือนปุ่ม secondary
export function SecondaryButtonLink({ href, className, children, ...props }) {
  return (
    <Link 
      href={href} 
      className={`border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

// Text Link ที่มีการ underline เมื่อ hover
export function TextLink({ href, className, children, ...props }) {
  return (
    <Link 
      href={href} 
      className={`text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}