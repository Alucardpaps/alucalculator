import { Metadata } from 'next';
import { ProjectClient } from './ProjectClient';

export const metadata: Metadata = {
  title: 'Manufacturing Lifecycle & Should-Cost Simulator (ISO 14067)',
  description:
    'Simulate manufacturing should-cost breakdowns, 5-axis CNC machining takt times, factory capacity lead times, and ISO 14067 carbon footprint for engineering parts.',
  alternates: {
    canonical: 'https://www.alucalculator.com/project-simulation/',
  },
};

export default function ProjectSimulationPage() {
  return <ProjectClient />;
}
