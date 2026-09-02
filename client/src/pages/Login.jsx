import { authApi } from '../api/client';
import { Blueprint, Button } from '../components/ui';

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center font-body text-text">
      <Blueprint className="flex flex-col items-center gap-6 p-8">
        <div>
          <h1 className="m-0 text-[28px]">PrintProfit</h1>
          <p className="mt-1 text-sm text-muted">Eshan Creations business tracker</p>
        </div>
        <Button onClick={() => (window.location.href = authApi.loginUrl)}>Sign in with Google</Button>
        <p className="max-w-xs text-xs text-muted">
          Your data syncs live to a private Google Sheet in your own Drive.
        </p>
      </Blueprint>
    </div>
  );
}
