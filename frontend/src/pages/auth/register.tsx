import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Head from 'next/head';
import { RegisterForm } from '@/types';
import { validatePassword } from '@/utils/auth';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

const RegisterPage: React.FC = () => {
  const { register: registerUser, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterForm>();

  const watchPassword = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      setError('password', {
        type: 'manual',
        message: passwordValidation.errors[0],
      });
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
      return;
    }

    try {
      await registerUser(data);
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  };

  return (
    <>
      <Head>
        <title>Register - Cashly</title>
        <meta name="description" content="Create your Cashly account" />
      </Head>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_cashly.png"
              alt="Cashly Logo"
              width={40}
              height={40}
              unoptimized
            />
            <h1 className="text-2xl font-bold text-white">Cashly</h1>
          </div>
        </div>

        {/* Left Branding for Desktop */}
        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="text-center text-white px-12">
            <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Image
                src="/logo_cashly.png"
                alt="Cashly Logo"
                width={80}
                height={80}
                unoptimized
              />
            </div>
            <h1 className="text-4xl font-bold mb-2">Cashly</h1>
            <p className="text-lg text-blue-100 mb-8">
              Start your financial journey
            </p>
            <div className="space-y-3 text-blue-100 text-sm">
              <p>✓ Free to get started</p>
              <p>✓ Secure & private</p>
              <p>✓ Simple and intuitive</p>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <div className="flex items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8">
            <div>
              <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-500">
                Or{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  sign in to your existing account
                </Link>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  {...register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Letters, numbers, underscores only',
                    },
                  })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  placeholder="your_username"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  placeholder="you@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="mt-2">
                  <PasswordStrengthIndicator password={watchPassword} />
                </div>

                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="relative mt-1">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  {errors.root.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5
                text-sm font-semibold text-white hover:bg-blue-700 transition
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                Create account
              </button>

              <p className="text-center text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
