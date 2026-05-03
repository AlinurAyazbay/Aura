import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn why Almaty needs Aura Optima — the science behind air purification towers and our mission for clean air.',
};

export default function AboutPage() {
  return <AboutClient />;
}
