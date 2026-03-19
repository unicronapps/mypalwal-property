export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} PropertyX. All rights reserved.</p>
        <p className="mt-1">Connecting buyers and sellers across tier 2 Indian cities.</p>
        {/* TODO: [PHASE-6] Add links to privacy policy, terms, contact */}
      </div>
    </footer>
  );
}
