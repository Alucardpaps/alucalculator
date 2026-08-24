import { redirect } from 'next/navigation';

/**
 * Calculators hub route — Redirects to /lite where all 100+ interactive solvers are listed.
 */
export default function CalculatorsIndexRedirect() {
  redirect('/lite');
}
