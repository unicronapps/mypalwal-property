import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Create Account — PropertyX',
};

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-500 text-sm mb-6">Join PropertyX — find or list properties in your city</p>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
