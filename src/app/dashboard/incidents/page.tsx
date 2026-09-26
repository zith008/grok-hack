import { IncidentsConsole } from '@/components/dashboard/IncidentsConsole';

export const metadata = { title: 'Autopilot — Incidents' };

export default function IncidentsPage() {
  const grokLive = Boolean(process.env.GROK_API_KEY);
  const wassistLive = Boolean(process.env.WASSIST_API_URL && process.env.WASSIST_API_KEY);
  const tavilyLive = Boolean(process.env.TAVILY_API_KEY);

  return <IncidentsConsole grokLive={grokLive} wassistLive={wassistLive} tavilyLive={tavilyLive} />;
}
