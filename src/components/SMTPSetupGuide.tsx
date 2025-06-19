import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Settings, Users } from 'lucide-react'

export default function SMTPSetupGuide() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/login">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6" />
              SMTP Email Setup Guide
            </CardTitle>
            <CardDescription>
              Configure custom SMTP for reliable email delivery in production
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Settings className="w-4 h-4" />
              <AlertDescription>
                <strong>Important:</strong> This configuration must be done in your Supabase dashboard, not in code.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Access SMTP Settings
                </h3>
                <p className="mb-2">Navigate to:</p>
                <Badge variant="outline" className="text-sm">
                  Supabase Dashboard → Your Project → Auth → Settings → SMTP
                </Badge>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Choose Email Provider
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-green-600">✅ SendGrid (Recommended)</CardTitle>
                      <CardDescription className="text-xs">Free tier available</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 pt-0">
                      <p><strong>Host:</strong> <code>smtp.sendgrid.net</code></p>
                      <p><strong>Port:</strong> <code>587</code></p>
                      <p><strong>User:</strong> <code>apikey</code></p>
                      <p><strong>Password:</strong> <code>YOUR_SENDGRID_API_KEY</code></p>
                      <p><strong>Sender:</strong> <code>no-reply@yourdomain.com</code></p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Mailgun</CardTitle>
                      <CardDescription className="text-xs">Reliable delivery</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 pt-0">
                      <p><strong>Host:</strong> <code>smtp.mailgun.org</code></p>
                      <p><strong>Port:</strong> <code>587</code></p>
                      <p><strong>User:</strong> <code>postmaster@your-domain</code></p>
                      <p><strong>Password:</strong> <code>YOUR_MAILGUN_PASSWORD</code></p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-yellow-600">⚠️ Gmail (Dev Only)</CardTitle>
                      <CardDescription className="text-xs">Not for production</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 pt-0">
                      <p><strong>Host:</strong> <code>smtp.gmail.com</code></p>
                      <p><strong>Port:</strong> <code>587</code></p>
                      <p><strong>User:</strong> <code>your-email@gmail.com</code></p>
                      <p><strong>Password:</strong> <code>APP_PASSWORD</code></p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Test Configuration
                </h3>
                <p>After saving SMTP settings, test by signing up a new user to receive verification emails.</p>
              </div>
              
              <Alert className="border-orange-200 bg-orange-50">
                <Users className="w-4 h-4" />
                <AlertDescription>
                  <strong>⚡ Temporary Workaround (If emails aren't working):</strong><br/>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Go to Supabase Dashboard → Auth → Users</li>
                    <li>Click on the user in the table</li>
                    <li>Change <code className="bg-gray-100 px-1 rounded">email_confirmed_at</code> to current timestamp</li>
                    <li>User can now log in without email confirmation</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}