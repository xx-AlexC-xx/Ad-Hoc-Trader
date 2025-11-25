import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link, useNavigate } from 'react-router-dom'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log("🔑 Session:", { session });
      
      if (session) {
        navigate('/dashboard')
      }
    }
    checkSession()
  }, [navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🧪 Email/Password:", email, password);
    setLoading(true)
    setMessage('')
    
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        })
        console.log("🔑 Login response:", { data, error });

        if (error) {
          setMessage(error.message)
        } else {
          setMessage('Check your email for confirmation link. If emails aren\'t working, see SMTP setup guide.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })
        console.log("🧪 Email/Password:", email, password);
        if (error) {
          setMessage(error.message)
        } else if (data.user) {
          // Successful login - navigate to dashboard
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setMessage('An unexpected error occurred. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/683e88b9e6e8029a192a1882_1749807866484_e86fbe99.PNG" 
              alt="ADHOC Trading Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl">
            {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {authMode === 'signup' 
              ? 'Sign up to start trading' 
              : 'Sign in to your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full"
            >
              {loading ? 'Processing...' : authMode === 'signup' ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          
          <div className="text-center space-y-2 mt-4">
            <p className="text-sm text-muted-foreground">
              {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              <Button
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
              >
                {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
              </Button>
            </p>
            
            <Link to="/smtp-setup" className="text-xs text-blue-500 hover:underline block">
              📧 Email not working? Setup SMTP Guide
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}