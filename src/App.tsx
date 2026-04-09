import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Users, 
  Trophy, 
  Instagram, 
  CheckCircle2, 
  AlertCircle, 
  Settings,
  ArrowRight,
  MapPin,
  Briefcase,
  Scissors,
  Trash2,
  RefreshCw,
  FileDown,
  QrCode,
  X,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import { addUser, getUsers, clearUsers, deleteUser, subscribeToUsers, User } from './firebase';

type View = 'registration' | 'admin' | 'success';

export default function App() {
  const [view, setView] = useState<View>('registration');
  const [users, setUsers] = useState<User[]>([]);
  const [winner, setWinner] = useState<User | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const PUBLIC_URL = 'https://ais-pre-otm45lpkuwl4gev7m6e54q-422422271927.us-west2.run.app';
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    activityBranch: '',
    rawMaterial: '',
    followedInstagram: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Real-time subscription to Firebase
    const unsubscribe = subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers);
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.phone || !formData.city || !formData.activityBranch || !formData.rawMaterial) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!formData.followedInstagram) {
      setError('Você precisa seguir a Avil Têxtil no Instagram para participar.');
      return;
    }

    // Duplicate check (by name and city)
    const isDuplicate = users.some(u => 
      u.fullName.toLowerCase().trim() === formData.fullName.toLowerCase().trim() && 
      u.city.toLowerCase().trim() === formData.city.toLowerCase().trim()
    );

    if (isDuplicate) {
      setError('Este usuário já está cadastrado para o sorteio.');
      return;
    }

    try {
      await addUser(formData);
      setFormData({
        fullName: '',
        phone: '',
        city: '',
        activityBranch: '',
        rawMaterial: '',
        followedInstagram: false
      });
      setView('success');
    } catch (err) {
      setError('Erro ao salvar cadastro. Tente novamente.');
    }
  };

  const runGiveaway = () => {
    if (users.length === 0) return;
    
    setIsDrawing(true);
    setWinner(null);

    // Simulate drawing animation
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * users.length);
      const selected = users[randomIndex];
      setWinner(selected);
      setIsDrawing(false);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5A5A40', '#A5A58D', '#D4A373']
      });
    }, 2000);
  };

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja apagar todos os cadastros?')) {
      await clearUsers();
      setWinner(null);
    }
  };

  const handleAdminAccess = () => {
    if (view === 'admin') {
      setView('registration');
      setAdminPassword('');
      setShowPasswordPrompt(false);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const verifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha padrão definida para o administrador
    if (adminPassword === 'avil2026') {
      setView('admin');
      setShowPasswordPrompt(false);
      setAdminPassword('');
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleDeleteUser = async (id: string | undefined) => {
    if (id === undefined) return;
    if (window.confirm('Deseja excluir este participante?')) {
      await deleteUser(id);
      if (winner?.id === id) setWinner(null);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Avil Têxtil - Lista de Participantes', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = users.map(user => [
      user.fullName,
      user.phone,
      user.city,
      user.activityBranch,
      user.rawMaterial,
      new Date(user.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Nome', 'Telefone', 'Cidade', 'Ramo', 'Matéria-prima', 'Data']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0] },
    });

    doc.save('participantes-avil-textil.pdf');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-white/20 px-6 py-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <img 
            src="https://i.postimg.cc/ZqBP5VWF/logo-jpg-removebg-preview.png" 
            alt="Avil Têxtil Logo" 
            className="h-12 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="hidden sm:block" translate="no">
            <h1 className="font-black text-xl leading-tight text-black" translate="no">Avil Têxtil</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">Sorteio Oficial</p>
          </div>
        </div>
        
        <button 
          onClick={handleAdminAccess}
          className="p-2 hover:bg-[#5A5A40]/5 rounded-full transition-colors text-[#5A5A40]"
          title="Alternar Visão"
        >
          {view === 'admin' ? <UserPlus size={24} /> : <Settings size={24} />}
        </button>
      </header>

      <main className="max-w-md mx-auto p-6 pb-24">
        <AnimatePresence mode="wait">
          {showPasswordPrompt && (
            <motion.div
              key="password-prompt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#f5f5f0]/80 backdrop-blur-sm"
            >
              <div className="bg-white border border-[#5A5A40]/20 rounded-3xl p-8 w-full max-w-xs shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full flex items-center justify-center mx-auto">
                    <Settings size={24} />
                  </div>
                  <h3 className="font-bold text-lg">Acesso Restrito</h3>
                  <p className="text-xs text-[#5A5A40]/60">Digite a senha para acessar as configurações.</p>
                </div>
                <form onSubmit={verifyPassword} className="space-y-4">
                  <input 
                    type="password"
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#f5f5f0] border border-[#5A5A40]/10 rounded-xl py-3 px-4 text-center focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                    placeholder="Senha"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowPasswordPrompt(false)}
                      className="flex-1 py-3 text-xs font-bold text-[#5A5A40]/60 hover:bg-[#5A5A40]/5 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-[#5A5A40] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#5A5A40]/20"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'registration' && (
            <motion.div
              key="reg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-2xl space-y-8 border border-white/20"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight text-black" translate="no">Participe agora</h2>
                <p className="text-gray-600 font-medium">Preencha seus dados e concorra a prêmios incríveis da <span translate="no">Avil Têxtil</span>.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-5">
                  <div className="relative">
                    <label className="text-xs font-black uppercase tracking-widest text-black mb-2 block">Nome Completo</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black font-semibold"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-black uppercase tracking-widest text-black mb-2 block">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black font-semibold"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-black uppercase tracking-widest text-black mb-2 block">Cidade</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black font-semibold"
                        placeholder="Sua cidade"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-black uppercase tracking-widest text-black mb-2 block">Ramo de Atividade</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        value={formData.activityBranch}
                        onChange={e => setFormData({...formData, activityBranch: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black font-semibold"
                        placeholder="Ex: Confecção, Artesanato..."
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-black uppercase tracking-widest text-black mb-2 block">Matéria-prima Utilizada</label>
                    <div className="relative">
                      <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        value={formData.rawMaterial}
                        onChange={e => setFormData({...formData, rawMaterial: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black font-semibold"
                        placeholder="Ex: Tecido, Linha, Botão..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-2xl text-white shadow-md">
                      <Instagram size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-black" translate="no">Siga-nos no Instagram</h4>
                      <a 
                        href="https://www.instagram.com/avilatacado/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-[#bc1888] hover:underline flex items-center gap-1"
                      >
                        @avilatacado <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-4 cursor-pointer group p-3 bg-white rounded-xl border border-gray-100 hover:border-black transition-all">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={formData.followedInstagram}
                        onChange={e => setFormData({...formData, followedInstagram: e.target.checked})}
                        className="peer sr-only"
                      />
                      <div className="w-7 h-7 border-2 border-gray-200 rounded-lg peer-checked:bg-black peer-checked:border-black transition-all flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <span className="text-sm font-black text-gray-700 group-hover:text-black transition-colors" translate="no">
                      Eu já sigo a <span translate="no">Avil Têxtil</span> no Instagram
                    </span>
                  </label>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium"
                  >
                    <AlertCircle size={18} />
                    {error}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-black text-white font-black py-5 rounded-3xl shadow-xl shadow-black/10 hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
                >
                  Finalizar Cadastro <ArrowRight size={24} />
                </button>

                <p className="text-[10px] text-gray-400 text-center font-bold px-4 mt-4">
                  Problemas no Safari? Clique em "Authenticate" ou use o Google Chrome.
                </p>
              </form>
            </motion.div>
          )}

          {view === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-12 shadow-2xl text-center space-y-8 border border-white/20"
            >
              <div className="w-28 h-28 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={64} />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-black">Tudo pronto!</h2>
                <p className="text-gray-600 font-medium text-lg">Seu cadastro foi realizado. Agora é só torcer!</p>
              </div>
              <button 
                onClick={() => setView('registration')}
                className="inline-flex items-center gap-2 text-black font-black hover:underline text-lg"
              >
                Fazer outro cadastro
              </button>
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-2xl space-y-8 border border-white/20"
            >
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight text-black">Painel Admin</h2>
                  <p className="text-gray-600 font-bold">{users.length} usuários cadastrados</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowQRCode(true)}
                    className="p-2 text-[#0047AB] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Mostrar QR Code"
                  >
                    <QrCode size={20} />
                  </button>
                  <button 
                    onClick={exportToPDF}
                    disabled={users.length === 0}
                    className="p-2 text-black hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                    title="Exportar para PDF"
                  >
                    <FileDown size={20} />
                  </button>
                  <button 
                    onClick={handleClearData}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Limpar todos os dados"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* QR Code Modal */}
              <AnimatePresence>
                {showQRCode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl space-y-6 relative"
                    >
                      <button 
                        onClick={() => setShowQRCode(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>

                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-black">QR Code do Sorteio</h3>
                        <p className="text-sm text-gray-500 font-medium">Aponte a câmera do celular para acessar o formulário de cadastro.</p>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 flex items-center justify-center shadow-inner">
                        <QRCodeSVG 
                          value={PUBLIC_URL} 
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Link Público</p>
                        <p className="text-xs font-bold text-black break-all">{PUBLIC_URL}</p>
                      </div>

                      <button 
                        onClick={() => window.print()}
                        className="w-full py-4 bg-black text-white font-black rounded-2xl shadow-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                      >
                        Imprimir QR Code <FileDown size={18} />
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Giveaway Section */}
              <div className="bg-black text-white rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <div className="w-24 h-24 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Trophy size={48} />
                </div>
                
                {winner ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-3"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-white/60">Ganhador(a)</p>
                    <h3 className="text-5xl font-black text-white tracking-tight">{winner.fullName}</h3>
                    <p className="text-lg font-bold text-white/80">{winner.city} • {winner.activityBranch}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black">Pronto para o sorteio?</h3>
                    <p className="text-base text-white/60 font-medium">Clique no botão abaixo para selecionar um vencedor aleatório.</p>
                  </div>
                )}

                <button 
                  onClick={runGiveaway}
                  disabled={isDrawing || users.length === 0}
                  className={`w-full py-5 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
                    isDrawing || users.length === 0 
                    ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10' 
                    : 'bg-white text-black hover:bg-gray-100 shadow-xl shadow-white/5 active:scale-[0.98]'
                  }`}
                >
                  {isDrawing ? (
                    <>
                      <RefreshCw className="animate-spin" size={24} /> Sorteando...
                    </>
                  ) : (
                    <>
                      Realizar Sorteio <Trophy size={24} />
                    </>
                  )}
                </button>
              </div>

              {/* User List */}
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Users size={18} /> Lista de Participantes
                </h3>
                <div className="bg-white border border-[#5A5A40]/10 rounded-2xl overflow-hidden divide-y divide-[#5A5A40]/5">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <div key={user.id} className="p-4 flex justify-between items-center hover:bg-[#f5f5f0]/50 transition-colors group">
                        <div className="flex-1">
                          <p className="font-bold text-sm">{user.fullName}</p>
                          <p className="text-xs text-gray-500 font-bold">{user.phone}</p>
                          <p className="text-xs text-gray-400 font-medium">{user.city} • {user.activityBranch}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] font-mono text-[#5A5A40]/40">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir participante"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[#5A5A40]/40 text-sm">
                      Nenhum usuário cadastrado ainda.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-white/20 p-4 text-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black" translate="no">
          © 2026 Avil Têxtil • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
