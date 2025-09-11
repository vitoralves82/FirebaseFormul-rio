export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s4.477-8 10-8 10 8 10 8-4.477 8-10 8-10-8-10-8z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M20.3 16.5c-1.5-1.2-3.4-2-5.3-2.3" />
      <path d="M3.7 16.5c1.5-1.2 3.4-2 5.3-2.3" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
    </svg>
  );
}
