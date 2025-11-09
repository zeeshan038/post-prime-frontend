import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLogin } from '../hooks/auth'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

type ApiErrorPayload = {
  msg?: string
  status?: boolean
  message?: string
  [key: string]: unknown
}

function getTokenFromResponse(res: unknown): string | undefined {
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>
    const accessToken = obj['accessToken']
    const token = obj['token']
    if (typeof accessToken === 'string') return accessToken
    if (typeof token === 'string') return token
  }
  return undefined
}

function getErrorPayload(err: unknown): ApiErrorPayload | null {
  if (err && typeof err === 'object') {
    const maybe = err as { response?: { data?: unknown } }
    const data = maybe.response?.data
    if (data && typeof data === 'object') {
      return data
    }
  }
  return null
}

function getErrorMessage(payload: ApiErrorPayload | null, err: unknown): string {
  const msgVal = payload ? payload['msg'] : undefined
  const messageVal = payload ? payload['message'] : undefined
  if (typeof msgVal === 'string') return msgVal
  if (typeof messageVal === 'string') return messageVal
  if (err instanceof Error && typeof err.message === 'string') return err.message
  return 'Login failed'
}

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const { mutateAsync, isPending } = useLogin()
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginErrorRaw, setLoginErrorRaw] = useState<ApiErrorPayload | null>(null)

  const onSubmit = async (values: LoginValues) => {
    try {
      setLoginError(null)
      setLoginErrorRaw(null)
      const res = await mutateAsync(values)
      const token = getTokenFromResponse(res)
      if (token) {
        try {
          localStorage.setItem('accessToken', token)
        } catch (e) {
          console.warn('Failed to save access token', e)
        }
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const errData = getErrorPayload(err)
      const serverMsg = getErrorMessage(errData, err)
      message.error(serverMsg)
      setLoginError(serverMsg)
      setLoginErrorRaw(errData)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffaf3] relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#d2f3e1_0%,transparent_25%),radial-gradient(circle_at_80%_80%,#d2f3e1_0%,transparent_25%)] opacity-50"></div>

      {/* Login card */}
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-6 z-10">
        {/* Brand */}
        <div className="flex items-center justify-center mb-4">
          <div className="text-2xl font-extrabold text-gray-900">PrimePost</div>
        </div>

        <div className="flex flex-col items-center mb-5">
          <div className="text-xl font-semibold text-gray-800">Log in</div>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Please enter your details.</p>
        </div>

        {loginError && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {loginError}
          </div>
        )}
        {/* Raw error payload intentionally not displayed */}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Email address"
              {...register('email')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              {...register('password')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="w-full mt-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white py-2 text-sm font-medium transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting || isPending ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-2">
          <hr className="flex-1 border-gray-300" />
          <span className="text-xs text-gray-500">or</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <a href="/signup" className="text-emerald-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

export default Login
