import { authApi } from '../api/client';
import { Button } from '../components/ui';

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100 px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">PrintProfit</h1>
        <p className="text-gray-500 text-sm mt-1">Eshan Creations business tracker</p>
      </div>
      <Button onClick={() => (window.location.href = authApi.loginUrl)}>Sign in with Google</Button>
      <p className="text-xs text-gray-400 max-w-xs">
        Your data syncs live to a private Google Sheet in your own Drive.
      </p>
    </div>
  );
}
