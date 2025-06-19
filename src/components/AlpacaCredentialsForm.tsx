import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AlpacaCredentialsFormProps {
  onCredentialsSubmitted: () => void;
}

export default function AlpacaCredentialsForm({ onCredentialsSubmitted }: AlpacaCredentialsFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://paper-api.alpaca.markets/v2');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Test credentials first
      const testResponse = await fetch(`${baseUrl}/account`, {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error('Invalid Alpaca credentials');
      }

      // Store credentials in Supabase
      const { error } = await supabase
        .from('user_alpaca_credentials')
        .upsert({
          user_id: user.id,
          api_key: apiKey,
          secret_key: secretKey,
          base_url: baseUrl,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Alpaca credentials saved successfully'
      });

      onCredentialsSubmitted();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save credentials',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect Your Alpaca Account</CardTitle>
        <CardDescription>
          Enter your Alpaca API credentials to start trading
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            For demo purposes, you can use the pre-filled paper trading credentials or enter your own.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key ID</Label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="PKR9NRP0Q9LWJBH47DEM"
              required
            />
          </div>
          <div>
            <Label htmlFor="secretKey">Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter your secret key"
              required
            />
          </div>
          <div>
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}