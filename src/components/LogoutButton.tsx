import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <button onClick={handleLogout} className="text-red-500 underline">
      Logout
    </button>
  )
}