import { redirect } from 'next/navigation';

/**
 * Login page disabled in static export mode.
 * Redirects to homepage.
 */
export default function LoginPage() {
    redirect('/');
}
