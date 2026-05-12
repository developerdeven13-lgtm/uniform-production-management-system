import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f2416', letterSpacing: '-0.5px', marginBottom: 2 }}>
        Sign in
      </h2>
      <p style={{ fontSize: 12, color: '#888780', marginBottom: 20 }}>
        Enter your credentials to access the system
      </p>
      <LoginForm />
    </>
  )
}
