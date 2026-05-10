import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Sign in</h2>
      <p className="text-sm text-slate-500 mb-6">Enter your credentials to access the system</p>
      <LoginForm />
    </>
  )
}
