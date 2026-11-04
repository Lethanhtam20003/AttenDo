import { redirect } from 'next/navigation';

export default function LegacyHostSetupPage() {
  redirect('/host/gps/setup');
}
