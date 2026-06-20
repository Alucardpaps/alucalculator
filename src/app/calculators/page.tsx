import { redirect } from 'next/navigation';

/** Calculators index moved into Academy — keep route for bookmarks & SEO. */
export default function CalculatorsIndexRedirect() {
  redirect('/academy?tab=calculators');
}
