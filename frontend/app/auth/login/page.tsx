import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In — PropertyX',
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in to your PropertyX account</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
