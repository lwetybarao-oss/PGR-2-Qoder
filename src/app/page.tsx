'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  LayoutDashboard,
  Users,
  Bell,
  FileText,
  LogOut,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  CheckSquare,
  AlertTriangle,
  Shield,
  CalendarClock,
  UserCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================
// Types
// ============================================================

interface User {
  id: string;
  name: string | null;
  username: string;
}

interface Arguido {
  id: string;
  numeroProcesso: string;
  nomeArguido: string;
  filiacaoPai: string | null;
  filiacaoMae: string | null;
  dataDetencao: string;
  dataRemessaJg: string | null;
  dataRegresso: string | null;
  crime: string;
  medidasAplicadas: string | null;
  magistradoResponsavel: string;
  dataRemessaSic: string | null;
  dataProrrogacao: string | null;
  remessaJgAlteracao: string | null;
  observacao1: string | null;
  observacao2: string | null;
  fim1Prazo: string;
  fim2Prazo: string | null;
  diasRestantes1: number;
  diasRestantes2: number | null;
  statusPrazo: string;
  alertas?: AlertaPrazo[];
}

interface AlertaPrazo {
  id: string;
  arguidoId: string;
  tipo: string;
  mensagem: string;
  lido: boolean;
  criadoEm: string;
  urgencia?: string;
  arguido?: {
    id: string;
    nomeArguido: string;
    numeroProcesso: string;
  };
}

interface DashboardData {
  totalArguidos: number;
  totalProrrogados: number;
  alertasCriticos: number;
  prazosVencidos: number;
  crimesStats: { crime: string; count: number }[];
  recentArguidos: Arguido[];
  recentAlertas: AlertaPrazo[];
}

// ============================================================
// Constants
// ============================================================

const CRIMES = [
  'Homicídio',
  'Roubo',
  'Tráfico de Drogas',
  'Corrupção',
  'Peculato',
  'Abuso de Poder',
  'Fraude',
  'Branqueamento de Capitais',
  'Associação Criminosa',
  'Sequestro',
  'Violência Doméstica',
  'Estupro',
  'Lesões Corporais Graves',
];

type ViewType = 'landing' | 'pesquisa-publica' | 'login' | 'dashboard' | 'arguidos' | 'arguido-form' | 'arguido-detail' | 'alertas' | 'relatorios';

// ============================================================
// Helpers
// ============================================================

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

function formatDateInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'vencido') {
    return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">Vencido</Badge>;
  }
  if (status === 'alerta') {
    return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">Alerta</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">Normal</Badge>;
}

function UrgenciaBadge({ urgencia }: { urgencia: string }) {
  if (urgencia === 'vencido') {
    return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">Vencido</Badge>;
  }
  if (urgencia === 'critico') {
    return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Crítico</Badge>;
  }
  if (urgencia === 'alerta') {
    return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">Alerta</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100">Normal</Badge>;
}

function downloadCSV(url: string, filename: string) {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    });
}

// ============================================================
// Landing Page
// ============================================================

function LandingView({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#1e3a5f] text-white">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4 border-b-4 border-[#c9a227] bg-black/20">
        <svg className="w-24 h-24 mx-auto mb-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 95 L50 20" stroke="#c9a227" strokeWidth="4" />
          <path d="M35 95 L65 95" stroke="#c9a227" strokeWidth="5" strokeLinecap="round" />
          <path d="M40 85 L60 85" stroke="#c9a227" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 30 L80 30" stroke="#c9a227" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 30 L15 50" stroke="#c9a227" strokeWidth="3" />
          <path d="M20 30 L25 50" stroke="#c9a227" strokeWidth="3" />
          <path d="M10 50 Q20 60 30 50" stroke="#c9a227" strokeWidth="3" fill="none" />
          <path d="M80 30 L75 50" stroke="#c9a227" strokeWidth="3" />
          <path d="M80 30 L85 50" stroke="#c9a227" strokeWidth="3" />
          <path d="M70 50 Q80 60 90 50" stroke="#c9a227" strokeWidth="3" fill="none" />
          <circle cx="50" cy="20" r="4" fill="#c9a227" />
        </svg>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-widest uppercase text-[#c9a227]">Republica de Angola</h2>
          <div className="w-24 h-0.5 bg-[#c9a227] mx-auto my-4" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wider uppercase">Procuradoria-Geral da Republica</h1>
          <h3 className="text-base sm:text-lg mt-4 leading-relaxed opacity-95 border-t-2 border-[#c9a227]/50 pt-4">Sistema de Controlo de Arguidos em Prisao Preventiva</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-xl">
          <button
            onClick={() => onNavigate('login')}
            className="flex-1 flex items-center justify-center gap-2 bg-[#c9a227] text-[#1e3a5f] font-semibold text-base px-6 py-3.5 rounded-lg border-3 border-[#c9a227] hover:bg-[#b8941f]"
          >
            <UserCircle className="w-5 h-5" />
            Acessar Sistema
          </button>
          <button
            onClick={() => onNavigate('pesquisa-publica')}
            className="flex-1 flex items-center justify-center gap-2 bg-transparent text-white font-semibold text-base px-6 py-3.5 rounded-lg border-3 border-white hover:bg-white/10"
          >
            <Search className="w-5 h-5" />
            Pesquisa Publica
          </button>
        </div>

        <div className="mt-8 bg-white/5 backdrop-blur rounded-xl p-5 max-w-lg">
          <p className="text-sm"><strong>Sistema Oficial</strong> da Procuradoria-Geral da Republica</p>
          <p className="text-sm opacity-80">Gestao e controlo de processos de prisao preventiva</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 py-4 px-4 text-center border-t-2 border-[#c9a227]/50">
        <p className="text-sm opacity-80">2026 Procuradoria-Geral da Republica - Republica de Angola</p>
        <p className="text-sm opacity-60 mt-1">Todos os direitos reservados</p>
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs opacity-50">Acesso restrito a pessoal autorizado | Sistema protegido por legislacao de seguranca de dados</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Pesquisa Publica View
// ============================================================

function PesquisaPublicaView({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<Arguido[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: '50' });
      const res = await fetch(`/api/arguidos?${params}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data);
      }
    } catch {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1e3a5f] text-white">
      {/* Header */}
      <div className="text-center pt-6 pb-3 px-4 border-b-4 border-[#c9a227] bg-black/20">
        <h1 className="text-xl sm:text-2xl font-bold">Procuradoria-Geral da Republica</h1>
        <h2 className="text-sm font-normal text-[#c9a227] tracking-widest uppercase">Republica de Angola</h2>
        <div className="mt-2">
          <button onClick={onBack} className="text-white/80 hover:text-white text-sm hover:underline">Voltar a Pagina Inicial</button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
        {/* Search section */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-5 mb-6">
          <h3 className="text-lg text-[#c9a227] text-center font-medium mb-4">Pesquisa de Processos</h3>
          <div className="flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o nome do arguido ou numero do processo..."
              className="flex-1 px-4 py-2.5 rounded bg-white/10 text-white placeholder-white/60 border-2 border-white/30 focus:outline-none focus:border-[#c9a227] text-sm"
            />
            <button
              onClick={doSearch}
              className="bg-[#c9a227] text-[#1e3a5f] font-semibold px-6 py-2.5 rounded text-sm hover:bg-[#b8941f] uppercase tracking-wide"
            >
              Pesquisar
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-black/25 backdrop-blur rounded-xl p-5 border-2 border-[#c9a227]/30">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-[#c9a227]/50">
              <h4 className="text-[#c9a227] text-lg font-semibold">Resultados da Pesquisa</h4>
              <span className="text-sm opacity-90">{results.length} resultado(s) encontrado(s)</span>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-400">A pesquisar...</div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xl mb-2 opacity-50">Nenhum resultado encontrado</p>
                <p className="text-sm opacity-60">Tente pesquisar com outro termo</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#c9a227]/50 to-[#c9a227]/40">
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">N. Processo</th>
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Nome do Arguido</th>
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider">Crime</th>
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">Data Detencao</th>
                      <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(a => (
                      <tr key={a.id} className="border-b border-white/20 hover:bg-white/10">
                        <td className="py-3 px-4 text-sm font-bold text-[#FFD700]">{a.numeroProcesso}</td>
                        <td className="py-3 px-4 text-sm">{a.nomeArguido}</td>
                        <td className="py-3 px-4 text-sm">{a.crime}</td>
                        <td className="py-3 px-4 text-sm hidden sm:table-cell">{formatDate(a.dataDetencao)}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <StatusBadge status={a.statusPrazo} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!searched && (
          <div className="text-center py-12">
            <p className="text-lg opacity-80">Utilize o campo de pesquisa acima para consultar processos</p>
            <p className="text-sm opacity-50">Pesquise pelo nome do arguido ou numero do processo</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-black/30 py-4 px-4 text-center border-t-2 border-[#c9a227]/50 mt-auto">
        <p className="text-sm opacity-80">2026 Procuradoria-Geral da Republica - Republica de Angola</p>
        <p className="text-sm opacity-60 mt-1">Todos os direitos reservados</p>
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs opacity-50">Acesso publico a informacoes resumidas | Dados protegidos por legislacao de seguranca</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Login View
// ============================================================

function LoginView({ onLogin, onBack }: { onLogin: (user: User) => void; onBack: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data.user);
        toast({ title: 'Sessão iniciada com sucesso' });
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao fazer login');
      }
    } catch {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F9A601] rounded-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PGR</h1>
          <p className="text-gray-500 mt-1">Procuradoria-Geral da República</p>
          <p className="text-sm text-gray-400 mt-1">Sistema de Gestão de Arguidos</p>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center">Iniciar Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Utilizador</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="nome.utilizador"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#F9A601] hover:bg-[#FA812A] text-white font-medium h-10"
                disabled={loading}
              >
                {loading ? 'A aguardar...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-400">
              Credenciais de demonstração: admin / admin123
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Navbar
// ============================================================

function Navbar({
  user,
  currentView,
  onNavigate,
  onLogout,
  alertCount,
}: {
  user: User;
  currentView: ViewType;
  onNavigate: (v: ViewType) => void;
  onLogout: () => void;
  alertCount: number;
}) {
  const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Painel', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'arguidos', label: 'Arguidos', icon: <Users className="w-4 h-4" /> },
    { view: 'alertas', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
    { view: 'relatorios', label: 'Relatórios', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-[#F9A601] text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 font-bold text-base">
              <Shield className="w-5 h-5" />
              <span className="hidden sm:inline">PGR - Gestão de Arguidos</span>
              <span className="sm:hidden">PGR</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium ${
                    currentView === item.view
                      ? 'bg-white/20 text-white'
                      : 'text-amber-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.view === 'alertas' && alertCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:block text-amber-100">
              <UserCircle className="w-4 h-4 inline mr-1" />
              {user.name || user.username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-amber-100 hover:bg-white/10 hover:text-white h-8"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden border-t border-amber-600/30">
        <div className="flex">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium ${
                currentView === item.view
                  ? 'bg-white/20 text-white'
                  : 'text-amber-100'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Footer
// ============================================================

function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 text-center py-3 text-xs mt-auto">
      © 2026 PGR - Procuradoria-Geral da República. Todos os direitos reservados.
    </footer>
  );
}

// ============================================================
// Dashboard View
// ============================================================

function DashboardView({ onNavigate, onVerificarPrazos }: { onNavigate: (v: ViewType) => void; onVerificarPrazos: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">A carregar dados...</div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Arguidos', value: data.totalArguidos, icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Prorrogados', value: data.totalProrrogados, icon: <CalendarClock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Alertas Críticos', value: data.alertasCriticos, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-700 border-red-200' },
    { label: 'Prazos Vencidos', value: data.prazosVencidos, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Painel de Controlo</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onVerificarPrazos} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Verificar Prazos
          </Button>
          <Button size="sm" onClick={() => onNavigate('arguido-form')} className="bg-[#F9A601] hover:bg-[#FA812A] text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Novo Arguido
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className={`border ${s.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-70">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className="opacity-60">{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent alerts */}
        <Card className="lg:col-span-2 border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Alertas Recentes</CardTitle>
              <Button variant="link" size="sm" className="text-xs p-0 h-auto text-[#F9A601]" onClick={() => onNavigate('alertas')}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {data.recentAlertas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum alerta recente</p>
            ) : (
              <div className="space-y-2">
                {data.recentAlertas.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-2 rounded bg-gray-50">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      a.mensagem.includes('VENCIDO') ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{a.mensagem}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {a.tipo === '1_prazo' ? '1º Prazo' : '2º Prazo'} · {formatDate(a.criadoEm)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Crimes distribution */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição por Crime</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.crimesStats.map(c => (
                <div key={c.crime} className="flex items-center justify-between">
                  <span className="text-sm truncate mr-2">{c.crime}</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs flex-shrink-0">
                    {c.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent arguidos */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Arguidos Recentes</CardTitle>
            <Button variant="link" size="sm" className="text-xs p-0 h-auto text-[#F9A601]" onClick={() => onNavigate('arguidos')}>
              Ver todos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Processo</TableHead>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">Crime</TableHead>
                  <TableHead className="text-xs">Magistrado</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentArguidos.map(a => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => onNavigate('arguido-detail')}
                  >
                    <TableCell className="text-xs font-medium">{a.numeroProcesso}</TableCell>
                    <TableCell className="text-xs">{a.nomeArguido}</TableCell>
                    <TableCell className="text-xs">{a.crime}</TableCell>
                    <TableCell className="text-xs">{a.magistradoResponsavel}</TableCell>
                    <TableCell><StatusBadge status={a.statusPrazo} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Arguidos List View
// ============================================================

function ArguidosListView({
  onNavigate,
  onSelectArguido,
}: {
  onNavigate: (v: ViewType) => void;
  onSelectArguido: (id: string) => void;
}) {
  const [arguidos, setArguidos] = useState<Arguido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [crimeFilter, setCrimeFilter] = useState('');
  const [magistradoFilter, setMagistradoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [crimes, setCrimes] = useState<string[]>([]);
  const [magistrados, setMagistrados] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const fetchArguidos = useCallback(async (p: number, s: string, c: string, m: string, st: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', '20');
      if (s) params.set('q', s);
      if (c) params.set('crime', c);
      if (m) params.set('magistrado', m);
      if (st) params.set('status_prazo', st);

      const res = await fetch(`/api/arguidos?${params}`);
      if (res.ok) {
        const json = await res.json();
        setArguidos(json.data);
        setPage(json.pagination.page);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch('/api/arguidos?limit=1000');
      if (res.ok) {
        const json = await res.json();
        const cSet = new Set<string>();
        const mSet = new Set<string>();
        json.data.forEach((a: Arguido) => {
          cSet.add(a.crime);
          mSet.add(a.magistradoResponsavel);
        });
        setCrimes(Array.from(cSet).sort());
        setMagistrados(Array.from(mSet).sort());
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchFilters(); }, [fetchFilters]);
  useEffect(() => { fetchArguidos(1, '', '', '', ''); }, [fetchArguidos]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      fetchArguidos(1, val, crimeFilter, magistradoFilter, statusFilter);
    }, 400);
  };

  const handleCrimeFilter = (val: string) => {
    setCrimeFilter(val);
    setPage(1);
    fetchArguidos(1, search, val, magistradoFilter, statusFilter);
  };

  const handleMagistradoFilter = (val: string) => {
    setMagistradoFilter(val);
    setPage(1);
    fetchArguidos(1, search, crimeFilter, val, statusFilter);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    setPage(1);
    fetchArguidos(1, search, crimeFilter, magistradoFilter, val);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === arguidos.length) {
      setSelected([]);
    } else {
      setSelected(arguidos.map(a => a.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Tem certeza que deseja remover ${selected.length} arguido(s)?`)) return;

    try {
      await Promise.all(selected.map(id => fetch(`/api/arguidos/${id}`, { method: 'DELETE' })));
      toast({ title: `${selected.length} arguido(s) removido(s)` });
      setSelected([]);
      fetchArguidos(page, search, crimeFilter, magistradoFilter, statusFilter);
    } catch {
      toast({ title: 'Erro ao remover arguidos', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Arguidos em Prisão Preventiva</h2>
        <Button size="sm" onClick={() => onNavigate('arguido-form')} className="bg-[#F9A601] hover:bg-[#FA812A] text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Arguido
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchInput}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={crimeFilter} onValueChange={handleCrimeFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Crime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os crimes</SelectItem>
                {crimes.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={magistradoFilter} onValueChange={handleMagistradoFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Magistrado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os magistrados</SelectItem>
                {magistrados.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Status do Prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os status</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alerta">Alerta (≤7 dias)</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded p-3">
          <span className="text-sm font-medium text-amber-800">{selected.length} selecionado(s)</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="text-xs h-8">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover Selecionados
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={arguidos.length > 0 && selected.length === arguidos.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs">Processo</TableHead>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Crime</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Magistrado</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Detenção</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                      A carregar...
                    </TableCell>
                  </TableRow>
                ) : arguidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                      Nenhum arguido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  arguidos.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(a.id)}
                          onCheckedChange={() => toggleSelect(a.id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-medium">{a.numeroProcesso}</TableCell>
                      <TableCell className="text-xs">{a.nomeArguido}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{a.crime}</TableCell>
                      <TableCell className="text-xs hidden lg:table-cell">{a.magistradoResponsavel}</TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{formatDate(a.dataDetencao)}</TableCell>
                      <TableCell><StatusBadge status={a.statusPrazo} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onSelectArguido(a.id)}
                            title="Ver detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onSelectArguido(a.id)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{total} registro(s) · Página {page} de {totalPages}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchArguidos(page - 1, search, crimeFilter, magistradoFilter, statusFilter)} className="h-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchArguidos(page + 1, search, crimeFilter, magistradoFilter, statusFilter)} className="h-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Arguido Form View (Create/Edit)
// ============================================================

function ArguidoFormView({
  editId,
  onBack,
  onSaved,
}: {
  editId: string | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [crimeSelect, setCrimeSelect] = useState('');
  const [crimeCustom, setCrimeCustom] = useState('');
  const { toast } = useToast();

  const [form, setForm] = useState({
    numeroProcesso: '',
    nomeArguido: '',
    filiacaoPai: '',
    filiacaoMae: '',
    dataDetencao: '',
    dataRemessaJg: '',
    dataRegresso: '',
    crime: '',
    medidasAplicadas: '',
    magistradoResponsavel: '',
    dataRemessaSic: '',
    dataProrrogacao: '',
    remessaJgAlteracao: '',
    observacao1: '',
    observacao2: '',
  });

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/arguidos/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            const a = data.data;
            setForm({
              numeroProcesso: a.numeroProcesso,
              nomeArguido: a.nomeArguido,
              filiacaoPai: a.filiacaoPai || '',
              filiacaoMae: a.filiacaoMae || '',
              dataDetencao: formatDateInput(a.dataDetencao),
              dataRemessaJg: formatDateInput(a.dataRemessaJg),
              dataRegresso: formatDateInput(a.dataRegresso),
              crime: a.crime,
              medidasAplicadas: a.medidasAplicadas || '',
              magistradoResponsavel: a.magistradoResponsavel,
              dataRemessaSic: formatDateInput(a.dataRemessaSic),
              dataProrrogacao: formatDateInput(a.dataProrrogacao),
              remessaJgAlteracao: formatDateInput(a.remessaJgAlteracao),
              observacao1: a.observacao1 || '',
              observacao2: a.observacao2 || '',
            });
            const found = CRIMES.find(c => c === a.crime);
            if (found) {
              setCrimeSelect(found);
            } else {
              setCrimeSelect('Outro');
              setCrimeCustom(a.crime);
            }
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCrimeChange = (val: string) => {
    setCrimeSelect(val);
    if (val === 'Outro') {
      updateField('crime', crimeCustom);
    } else {
      updateField('crime', val);
      setCrimeCustom('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const crime = crimeSelect === 'Outro' ? crimeCustom : crimeSelect;
    if (!crime) {
      setError('Por favor, selecione ou especifique o crime.');
      setSaving(false);
      return;
    }

    const payload = { ...form, crime };

    try {
      const url = editId ? `/api/arguidos/${editId}` : '/api/arguidos';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: editId ? 'Arguido atualizado com sucesso' : 'Arguido criado com sucesso' });
        onSaved();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar');
      }
    } catch {
      setError('Erro de conexão com o servidor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400">A carregar...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-xl font-semibold">{editId ? 'Editar Arguido' : 'Novo Arguido'}</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Identificação */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nº do Processo *</Label>
                  <Input value={form.numeroProcesso} onChange={e => updateField('numeroProcesso', e.target.value)} placeholder="Ex: PP-2025/016" required className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome do Arguido *</Label>
                  <Input value={form.nomeArguido} onChange={e => updateField('nomeArguido', e.target.value)} placeholder="Nome completo" required className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Filiação (Pai)</Label>
                  <Input value={form.filiacaoPai} onChange={e => updateField('filiacaoPai', e.target.value)} placeholder="Nome do pai" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Filiação (Mãe)</Label>
                  <Input value={form.filiacaoMae} onChange={e => updateField('filiacaoMae', e.target.value)} placeholder="Nome da mãe" className="h-9 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cronologia */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cronologia</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data de Detenção *</Label>
                  <Input type="date" value={form.dataDetencao} onChange={e => updateField('dataDetencao', e.target.value)} required className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data de Remessa ao JG</Label>
                  <Input type="date" value={form.dataRemessaJg} onChange={e => updateField('dataRemessaJg', e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data de Regresso</Label>
                  <Input type="date" value={form.dataRegresso} onChange={e => updateField('dataRegresso', e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jurídico */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações Jurídicas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Crime *</Label>
                <Select value={crimeSelect} onValueChange={handleCrimeChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o crime..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CRIMES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value="Outro">Outro (especificar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {crimeSelect === 'Outro' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Especifique o crime *</Label>
                  <Input value={crimeCustom} onChange={e => { setCrimeCustom(e.target.value); updateField('crime', e.target.value); }} placeholder="Digite o crime..." className="h-9 text-sm" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Medidas Aplicadas</Label>
                <Textarea value={form.medidasAplicadas} onChange={e => updateField('medidasAplicadas', e.target.value)} placeholder="Descreva as medidas aplicadas..." rows={3} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Magistrado Responsável *</Label>
                <Input value={form.magistradoResponsavel} onChange={e => updateField('magistradoResponsavel', e.target.value)} placeholder="Nome do magistrado" required className="h-9 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Prazos */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gestão de Prazos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data de Remessa ao SIC</Label>
                  <Input type="date" value={form.dataRemessaSic} onChange={e => updateField('dataRemessaSic', e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data de Prorrogação</Label>
                  <Input type="date" value={form.dataProrrogacao} onChange={e => updateField('dataProrrogacao', e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Remessa ao JG / Alteração</Label>
                  <Input type="date" value={form.remessaJgAlteracao} onChange={e => updateField('remessaJgAlteracao', e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Observação 1</Label>
                <Textarea value={form.observacao1} onChange={e => updateField('observacao1', e.target.value)} placeholder="Observações adicionais..." rows={3} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Observação 2</Label>
                <Textarea value={form.observacao2} onChange={e => updateField('observacao2', e.target.value)} placeholder="Mais observações..." rows={3} className="text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="text-sm">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#F9A601] hover:bg-[#FA812A] text-white text-sm">
              {saving ? 'A guardar...' : editId ? 'Guardar Alterações' : 'Criar Arguido'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Arguido Detail View
// ============================================================

function ArguidoDetailView({
  arguidoId,
  onBack,
  onEdit,
  onDelete,
}: {
  arguidoId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [data, setData] = useState<Arguido | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/arguidos/${arguidoId}`)
      .then(res => res.json())
      .then(json => { if (json.data) setData(json.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [arguidoId]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/arguidos/${arguidoId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Arguido removido com sucesso' });
        onDelete();
      }
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
    setShowDeleteDialog(false);
  };

  if (loading || !data) {
    return <div className="text-center py-10 text-gray-400">A carregar...</div>;
  }

  const prazo1Color = data.diasRestantes1 < 0 ? 'text-red-700 bg-red-50 border-red-200' :
    data.diasRestantes1 <= 7 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-green-700 bg-green-50 border-green-200';

  const prazo2Color = data.diasRestantes2 === null ? '' :
    data.diasRestantes2 < 0 ? 'text-red-700 bg-red-50 border-red-200' :
    data.diasRestantes2 <= 7 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-green-700 bg-green-50 border-green-200';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <h2 className="text-xl font-semibold">{data.nomeArguido}</h2>
          <StatusBadge status={data.statusPrazo} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="text-xs h-8">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="text-xs h-8">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
          </Button>
        </div>
      </div>

      {/* Prazo indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border ${prazo1Color}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-70">1º Prazo (90 dias)</p>
                <p className="text-lg font-bold mt-1">
                  {data.diasRestantes1 < 0
                    ? `Vencido há ${Math.abs(data.diasRestantes1)} dia(s)`
                    : data.diasRestantes1 === 0
                    ? 'Vence hoje!'
                    : `${data.diasRestantes1} dia(s) restantes`}
                </p>
                <p className="text-xs mt-1">Fim: {formatDate(data.fim1Prazo)}</p>
              </div>
              <CalendarClock className="w-8 h-8 opacity-40" />
            </div>
          </CardContent>
        </Card>
        {data.diasRestantes2 !== null && (
          <Card className={`border ${prazo2Color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-70">2º Prazo (90 dias)</p>
                  <p className="text-lg font-bold mt-1">
                    {data.diasRestantes2 < 0
                      ? `Vencido há ${Math.abs(data.diasRestantes2)} dia(s)`
                      : data.diasRestantes2 === 0
                      ? 'Vence hoje!'
                      : `${data.diasRestantes2} dia(s) restantes`}
                  </p>
                  <p className="text-xs mt-1">Fim: {formatDate(data.fim2Prazo!)}</p>
                </div>
                <CalendarClock className="w-8 h-8 opacity-40" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Nº Processo</dt>
                <dd className="font-medium">{data.numeroProcesso}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium">{data.nomeArguido}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Filiação (Pai)</dt>
                <dd>{data.filiacaoPai || '-'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Filiação (Mãe)</dt>
                <dd>{data.filiacaoMae || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cronologia</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Data de Detenção</dt>
                <dd className="font-medium">{formatDate(data.dataDetencao)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Remessa ao JG</dt>
                <dd>{formatDate(data.dataRemessaJg)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Data de Regresso</dt>
                <dd>{formatDate(data.dataRegresso)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações Jurídicas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Crime</dt>
                <dd className="font-medium">{data.crime}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Magistrado</dt>
                <dd className="font-medium">{data.magistradoResponsavel}</dd>
              </div>
              <Separator />
              <div className="text-sm">
                <dt className="text-gray-500">Medidas Aplicadas</dt>
                <dd className="mt-1">{data.medidasAplicadas || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Gestão de Prazos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Remessa ao SIC</dt>
                <dd>{formatDate(data.dataRemessaSic)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Data de Prorrogação</dt>
                <dd>{formatDate(data.dataProrrogacao)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Remessa JG / Alteração</dt>
                <dd>{formatDate(data.remessaJgAlteracao)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {(data.observacao1 || data.observacao2) && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {data.observacao1 && <p className="text-sm">{data.observacao1}</p>}
            {data.observacao2 && <p className="text-sm">{data.observacao2}</p>}
          </CardContent>
        </Card>
      )}

      {/* Alertas do arguido */}
      {data.alertas && data.alertas.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alertas ({data.alertas.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.alertas.map(a => (
                <div key={a.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.mensagem.includes('VENCIDO') ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <p>{a.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(a.criadoEm)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o arguido <strong>{data.nomeArguido}</strong>? Esta acção pode ser revertida por um administrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-sm">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="text-sm">Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Alertas View
// ============================================================

function AlertasView() {
  const [alertas, setAlertas] = useState<AlertaPrazo[]>([]);
  const [stats, setStats] = useState({ total: 0, naoLidos: 0, lidos: 0, vencidos: 0 });
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState('');
  const [lidoFilter, setLidoFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchAlertas = useCallback(async (tipo: string, lido: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tipo) params.set('tipo', tipo);
      if (lido) params.set('lido', lido);

      const res = await fetch(`/api/alertas?${params}`);
      if (res.ok) {
        const json = await res.json();
        setAlertas(json.data);
        setStats(json.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlertas('', ''); }, [fetchAlertas]);

  const handleTipoFilter = (val: string) => {
    setTipoFilter(val);
    setSelected([]);
    fetchAlertas(val, lidoFilter);
  };

  const handleLidoFilter = (val: string) => {
    setLidoFilter(val);
    setSelected([]);
    fetchAlertas(tipoFilter, val);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleMarkRead = async () => {
    if (selected.length === 0) return;
    try {
      await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected, action: 'mark_read' })
      });
      toast({ title: `${selected.length} alerta(s) marcado(s) como lido(s)` });
      setSelected([]);
      fetchAlertas(tipoFilter, lidoFilter);
    } catch {
      toast({ title: 'Erro ao atualizar alertas', variant: 'destructive' });
    }
  };

  const handleDeleteAlertas = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Tem certeza que deseja eliminar ${selected.length} alerta(s)?`)) return;

    try {
      await fetch('/api/alertas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });
      toast({ title: `${selected.length} alerta(s) eliminado(s)` });
      setSelected([]);
      fetchAlertas(tipoFilter, lidoFilter);
    } catch {
      toast({ title: 'Erro ao eliminar alertas', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Alertas de Prazos</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-gray-200"><CardContent className="p-3 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-gray-200 bg-amber-50"><CardContent className="p-3 text-center"><p className="text-xs text-amber-600">Não Lidos</p><p className="text-lg font-bold text-amber-700">{stats.naoLidos}</p></CardContent></Card>
        <Card className="border-gray-200 bg-green-50"><CardContent className="p-3 text-center"><p className="text-xs text-green-600">Lidos</p><p className="text-lg font-bold text-green-700">{stats.lidos}</p></CardContent></Card>
        <Card className="border-gray-200 bg-red-50"><CardContent className="p-3 text-center"><p className="text-xs text-red-600">Vencidos</p><p className="text-lg font-bold text-red-700">{stats.vencidos}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={tipoFilter} onValueChange={handleTipoFilter}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos</SelectItem>
            <SelectItem value="1_prazo">1º Prazo</SelectItem>
            <SelectItem value="2_prazo">2º Prazo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={lidoFilter} onValueChange={handleLidoFilter}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos</SelectItem>
            <SelectItem value="false">Não lidos</SelectItem>
            <SelectItem value="true">Lidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded p-3">
          <span className="text-sm font-medium text-amber-800">{selected.length} selecionado(s)</span>
          <Button size="sm" onClick={handleMarkRead} className="text-xs h-8 bg-[#F9A601] hover:bg-[#FA812A] text-white">
            <CheckSquare className="w-3.5 h-3.5 mr-1" /> Marcar como Lido
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteAlertas} className="text-xs h-8">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-gray-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={alertas.length > 0 && selected.length === alertas.length}
                      onCheckedChange={() => setSelected(selected.length === alertas.length ? [] : alertas.map(a => a.id))}
                    />
                  </TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Mensagem</TableHead>
                  <TableHead className="text-xs">Arguido</TableHead>
                  <TableHead className="text-xs">Urgência</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">A carregar...</TableCell></TableRow>
                ) : alertas.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Nenhum alerta encontrado</TableCell></TableRow>
                ) : (
                  alertas.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggleSelect(a.id)} />
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(a.criadoEm)}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-xs">{a.tipo === '1_prazo' ? '1º Prazo' : '2º Prazo'}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{a.mensagem}</TableCell>
                      <TableCell className="text-xs">{a.arguido?.nomeArguido || '-'}</TableCell>
                      <TableCell><UrgenciaBadge urgencia={a.urgencia || 'normal'} /></TableCell>
                      <TableCell className="text-xs">{a.lido ? 'Lido' : 'Não lido'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Relatórios View
// ============================================================

function RelatoriosView() {
  const [activeTab, setActiveTab] = useState('proximos');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Relatórios</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="proximos">Próximos do Vencimento</TabsTrigger>
          <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="mt-4">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Arguidos com Prazos Próximos (≤14 dias)</CardTitle>
                <Button size="sm" variant="outline" onClick={() => downloadCSV('/api/relatorios/csv/prazos-proximos', 'prazos-proximos.csv')} className="text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <RelatorioContent tipo="proximos" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vencidos" className="mt-4">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Prazos Vencidos</CardTitle>
                <Button size="sm" variant="outline" onClick={() => downloadCSV('/api/relatorios/csv/vencidos', 'prazos-vencidos.csv')} className="text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <RelatorioContent tipo="vencidos" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geral" className="mt-4">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Relatório Geral</CardTitle>
                <Button size="sm" variant="outline" onClick={() => downloadCSV('/api/relatorios/csv/geral', 'relatorio-geral.csv')} className="text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <RelatorioContent tipo="geral" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RelatorioContent({ tipo }: { tipo: string }) {
  const [arguidos, setArguidos] = useState<Arguido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/arguidos?limit=1000')
      .then(res => res.json())
      .then(json => {
        let filtered = json.data || [];
        if (tipo === 'proximos') {
          filtered = filtered.filter((a: Arguido) => a.diasRestantes1 <= 14 || (a.diasRestantes2 !== null && a.diasRestantes2 <= 14));
        } else if (tipo === 'vencidos') {
          filtered = filtered.filter((a: Arguido) => a.diasRestantes1 < 0 || (a.diasRestantes2 !== null && a.diasRestantes2 < 0));
        }
        setArguidos(filtered);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [tipo]);

  if (loading) return <div className="text-center py-4 text-gray-400 text-sm">A carregar...</div>;

  if (arguidos.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Nenhum registo encontrado para este relatório.</p>;
  }

  return (
    <div className="overflow-x-auto max-h-96 overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">Processo</TableHead>
            <TableHead className="text-xs">Nome</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Crime</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Magistrado</TableHead>
            {tipo !== 'geral' && <TableHead className="text-xs">Detenção</TableHead>}
            <TableHead className="text-xs">Fim 1º Prazo</TableHead>
            <TableHead className="text-xs">Dias 1º</TableHead>
            <TableHead className="text-xs">Fim 2º Prazo</TableHead>
            <TableHead className="text-xs">Dias 2º</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {arguidos.map(a => (
            <TableRow key={a.id}>
              <TableCell className="text-xs font-medium">{a.numeroProcesso}</TableCell>
              <TableCell className="text-xs">{a.nomeArguido}</TableCell>
              <TableCell className="text-xs hidden md:table-cell">{a.crime}</TableCell>
              <TableCell className="text-xs hidden lg:table-cell">{a.magistradoResponsavel}</TableCell>
              {tipo !== 'geral' && <TableCell className="text-xs">{formatDate(a.dataDetencao)}</TableCell>}
              <TableCell className="text-xs">{formatDate(a.fim1Prazo)}</TableCell>
              <TableCell className={`text-xs font-medium ${a.diasRestantes1 < 0 ? 'text-red-600' : a.diasRestantes1 <= 7 ? 'text-amber-600' : ''}`}>
                {a.diasRestantes1}
              </TableCell>
              <TableCell className="text-xs">{a.fim2Prazo ? formatDate(a.fim2Prazo) : '-'}</TableCell>
              <TableCell className={`text-xs font-medium ${a.diasRestantes2 !== null && a.diasRestantes2 < 0 ? 'text-red-600' : a.diasRestantes2 !== null && a.diasRestantes2 <= 7 ? 'text-amber-600' : ''}`}>
                {a.diasRestantes2 !== null ? a.diasRestantes2 : '-'}
              </TableCell>
              <TableCell><StatusBadge status={a.statusPrazo} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================
// Main App
// ============================================================

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('login');
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedArguidoId, setSelectedArguidoId] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const { toast } = useToast();

  // Check session on mount
  useEffect(() => {
    fetch('/api/auth/login')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
          setView('dashboard');
        }
      })
      .catch(() => {
        // Not authenticated, show login
      })
      .finally(() => setAuthChecked(true));

    // Seed data on first load
    fetch('/api/seed', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('Seed completed:', data.message);
        }
      })
      .catch(err => console.error('Seed error:', err));
  }, []);

  // Fetch alert count periodically
  useEffect(() => {
    if (!user) return;

    const fetchAlertCount = () => {
      fetch('/api/alertas?lido=false')
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json) setAlertCount(json.stats?.naoLidos || 0);
        })
        .catch(() => {});
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (u: User) => {
    setUser(u);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    setUser(null);
    setView('login');
    toast({ title: 'Sessão terminada' });
  };

  const handleNavigate = (v: ViewType) => {
    if (v === 'arguido-form') {
      setSelectedArguidoId(null);
    }
    setView(v);
  };

  const handleSelectArguido = (id: string) => {
    setSelectedArguidoId(id);
    setView('arguido-detail');
  };

  const handleVerificarPrazos = async () => {
    try {
      const res = await fetch('/api/alertas/verificar', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
      }
    } catch {
      toast({ title: 'Erro ao verificar prazos', variant: 'destructive' });
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">A carregar...</div>
      </div>
    );
  }

  if (!user || view === 'login') {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user}
        currentView={view}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        alertCount={alertCount}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {view === 'dashboard' && (
          <DashboardView onNavigate={handleNavigate} onVerificarPrazos={handleVerificarPrazos} />
        )}

        {view === 'arguidos' && (
          <ArguidosListView onNavigate={handleNavigate} onSelectArguido={handleSelectArguido} />
        )}

        {view === 'arguido-form' && (
          <ArguidoFormView
            editId={selectedArguidoId}
            onBack={() => setView(selectedArguidoId ? 'arguido-detail' : 'arguidos')}
            onSaved={() => setView('arguidos')}
          />
        )}

        {view === 'arguido-detail' && selectedArguidoId && (
          <ArguidoDetailView
            arguidoId={selectedArguidoId}
            onBack={() => setView('arguidos')}
            onEdit={() => setView('arguido-form')}
            onDelete={() => setView('arguidos')}
          />
        )}

        {view === 'alertas' && <AlertasView />}

        {view === 'relatorios' && <RelatoriosView />}
      </main>

      <Footer />
    </div>
  );
}
