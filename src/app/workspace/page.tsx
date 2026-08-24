import { redirect } from 'next/navigation';

/**
 * Server-side redirect for 3D Workspace -> Design Studio
 */
export default function WorkspaceRedirect() {
  redirect('/design-studio');
}
