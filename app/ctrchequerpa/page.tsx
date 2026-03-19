'use client';

import { useState, useEffect } from 'react';
import LogoCoopergen from '@/components/LogoCoopergen';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

// Helpers para Cookies
const setCookie = (name: string, value: string, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

const getCookie = (name: string) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const eraseCookie = (name: string) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/;';
};

export default function PublicPaystubPage() {
  const [step, setStep] = useState(0); // 0: Initializing, 1: Matricula, 2: CPF, 3: Tipo, 4: Ano, 5: Resultados
  const [matricula, setMatricula] = useState('');
  const [cpfPrefix, setCpfPrefix] = useState('');
  const [year, setYear] = useState(YEARS[0]);
  const [filterType, setFilterType] = useState('Contra Cheque');
  const [userName, setUserName] = useState('');
  const [paystubs, setPaystubs] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mount logic: Load from cookies
  useEffect(() => {
    const savedMatricula = getCookie('pub_matricula');
    const savedCpf = getCookie('pub_cpf');
    const savedYear = getCookie('pub_year');
    const savedType = getCookie('pub_type');

    if (savedMatricula) setMatricula(savedMatricula);
    if (savedCpf) setCpfPrefix(savedCpf);
    if (savedYear) setYear(savedYear);
    if (savedType) setFilterType(savedType);

    if (savedMatricula && savedCpf && savedYear) {
      // Se tem tudo salvo, vai para o passo da seleção de tipo
      validateAndGetUserName(savedMatricula, savedCpf);
      setStep(4);
    } else {
      setStep(1);
    }
  }, []);

  // Auto-fetch results when step 5 is reached
  useEffect(() => {
    if (step === 5) {
      fetchData();
    }
  }, [step, filterType]);

  const maskPhone = (v: string) => {
    let r = v.replace(/\D/g, "");
    if (r.length > 11) r = r.substring(0, 11);
    if (r.length > 7) r = `(${r.substring(0, 2)}) ${r.substring(2, 3)} ${r.substring(3, 7)}.${r.substring(7)}`;
    else if (r.length > 3) r = `(${r.substring(0, 2)}) ${r.substring(2, 3)} ${r.substring(3)}`;
    else if (r.length > 2) r = `(${r.substring(0, 2)}) ${r.substring(2)}`;
    else if (r.length > 0) r = `(${r}`;
    return r;
  };
  
  const maskDate = (v: string) => {
    let r = v.replace(/\D/g, "");
    if (r.length > 8) r = r.substring(0, 8);
    if (r.length > 4) r = `${r.substring(0, 2)}/${r.substring(2, 4)}/${r.substring(4)}`;
    else if (r.length > 2) r = `${r.substring(0, 2)}/${r.substring(2)}`;
    return r;
  };

  const validateAndGetUserName = async (m: string, c: string) => {
    try {
      const res = await fetch('/api/public-paystubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula: m, cpfPrefix: c })
      });
      const data = await res.json();
      if (res.ok) {
        setUserName(data.name);
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setBirthDate(data.birthDate || '');
        setProfileConfirmed(data.profileConfirmed);
      }
    } catch (err) { console.error(err); }
  };

  const handleNextStep = async () => {
    setError('');
    
    if (step === 1) {
      if (!matricula) {
        setError('Por favor, informe sua matrícula.');
        return;
      }
      setCookie('pub_matricula', matricula);
      setStep(2);
    } else if (step === 2) {
      if (cpfPrefix.length < 5) {
        setError('Por favor, informe os 5 primeiros dígitos do seu CPF.');
        return;
      }
      setCookie('pub_cpf', cpfPrefix);
      validateBeforeType();
    } else if (step === 3) { // Tipo
      setCookie('pub_type', filterType);
      // Se for Contra Cheque, precisa do Ano.
      // Segundo o usuário: "se eu responder que o tipo sendo Rendimento ou Rateio nao tem necessidade de mostar o ano ja entra direto"
      if (filterType === 'Contra Cheque') {
        setStep(4);
      } else {
        // Para Rendimento/Rateio, "entra direto" com todos os anos.
        // Chamaremos fetchData com year='all'
        setYear('all'); 
        setStep(5);
      }
    } else if (step === 4) { // Ano
      if (!year) {
        setError('Por favor, selecione o ano.');
        return;
      }
      setCookie('pub_year', year);
      setStep(5);
    }
  };

  const handleConfirmProfile = async () => {
    setLoading(true);
    setError('');
    
    // Validar email e fone
    if (!email || !email.includes('@')) {
      setError('E-mail inválido.');
      setLoading(false);
      return;
    }
    if (phone.length < 16) { // (85) 9 8888.8888 = 16 chars com mascara
      setError('Telefone incompleto.');
      setLoading(false);
      return;
    }
    if (birthDate.length < 10) { // dd/mm/yyyy = 10 chars
      setError('Data de nascimento incompleta.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/public-profile/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula, cpfPrefix, email, phone, birthDate })
      });
      if (res.ok) {
        setProfileConfirmed(true);
        setStep(3); // Vai para o passo de Tipo após confirmar perfil
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao confirmar perfil.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeType = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public-paystubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula, cpfPrefix })
      });
      const data = await res.json();
      
      if (res.ok) {
        setUserName(data.name);
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setBirthDate(data.birthDate || '');
        setProfileConfirmed(data.profileConfirmed);

        // Se o perfil já estiver confirmado, vai para o passo 3 (Tipo). Se não, vai para o 2.5 (confirmação)
        if (data.profileConfirmed) {
          setStep(3);
        } else {
          setStep(2.5);
        }
      } else {
        setError(data.error || 'Dados inválidos.');
        if (data.error?.toLowerCase().includes('matrícula')) setStep(1);
        else setStep(2);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    eraseCookie('pub_matricula');
    eraseCookie('pub_cpf');
    eraseCookie('pub_year');
    eraseCookie('pub_type');
    setMatricula('');
    setCpfPrefix('');
    setYear('');
    setFilterType('Contra Cheque');
    setUserName('');
    setPaystubs([]);
    setStep(1);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public-paystubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matricula, 
          cpfPrefix, 
          year: filterType === 'Contra Cheque' ? year : 'all', 
          type: filterType 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPaystubs(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) return <div className="loading-state"><span>Carregando...</span></div>;

  return (
    <div className="public-view-container fade-in">
      <header className="public-header">
        <LogoCoopergen size={40} />
        {userName && <h2 className="greeting">Olá, Sr(a). {userName}</h2>}
        {!userName && <h2 className="greeting">Consulta de Documentos</h2>}
        <div style={{ width: 40 }}></div>
      </header>

      <main className="content-area">
        {step === 1 && (
          <div className="card-step">
            <h1 className="title">DIGITE SUA MATRÍCULA</h1>
            <p className="subtitle">Digite sua matrícula sem pontos ou sinais.</p>
            <input 
              type="text" 
              className="large-input"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="0000"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
            />
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-action" onClick={handleNextStep} disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card-step">
            <h1 className="title">VALIDAÇÃO DE IDENTIDADE</h1>
            <p className="subtitle">Digite os 5 PRIMEIROS dígitos do seu CPF.</p>
            <input 
              type="text" 
              className="large-input"
              value={cpfPrefix}
              onChange={(e) => setCpfPrefix(e.target.value.replace(/\D/g, '').substring(0, 5))}
              placeholder="00000"
              autoFocus
              maxLength={5}
              onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
            />
            {error && <p className="error-msg">{error}</p>}
            <div className="actions-row">
                <button className="btn-back" onClick={() => setStep(1)}>Voltar</button>
                <button className="btn-action" onClick={handleNextStep}>Próximo</button>
            </div>
          </div>
        )}

        {step === 2.5 && (
          <div className="card-step">
            <h1 className="title">CONFIRME SEUS DADOS</h1>
            <p className="subtitle">Seus dados estão corretos? Se necessário, atualize-os abaixo.</p>
            
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                <label className="field-label">E-MAIL</label>
                <input 
                  type="email" 
                  className="large-input"
                  style={{ fontSize: 16, textAlign: 'left' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label className="field-label">CELULAR (WHATSAPP)</label>
                <input 
                  type="text" 
                  className="large-input"
                  style={{ fontSize: 16, textAlign: 'left' }}
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(85) 9 9999.9999"
                />
            </div>
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label className="field-label">DATA DE NASCIMENTO</label>
                <input 
                  type="text" 
                  className="large-input"
                  style={{ fontSize: 16, textAlign: 'left' }}
                  value={birthDate}
                  onChange={(e) => setBirthDate(maskDate(e.target.value))}
                  placeholder="DD/MM/AAAA"
                />
            </div>

            {error && <p className="error-msg">{error}</p>}
            
            <div className="actions-row">
                <button className="btn-back" onClick={() => setStep(2)}>Voltar</button>
                <button className="btn-action" onClick={handleConfirmProfile} disabled={loading}>
                  {loading ? 'Processando...' : 'Confirmar Dados'}
                </button>
            </div>
            
            <button 
              className="btn-link" 
              style={{ marginTop: 20 }}
              onClick={() => setStep(3)}
            >
              Confirmar mais tarde (continuar)
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="card-step">
            <h1 className="title">O QUE VOCÊ PROCURA?</h1>
            <p className="subtitle">Selecione o tipo de documento.</p>
            
            <div className="type-buttons vertical">
              {['Contra Cheque', 'Rendimento', 'Rateio'].map(t => (
                <button 
                  key={t}
                  className={`type-btn large ${filterType === t ? 'active' : ''}`}
                  onClick={() => { setFilterType(t); setCookie('pub_type', t); }}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="actions-row" style={{ marginTop: 24 }}>
                <button className="btn-back" onClick={() => setStep(2)}>Voltar</button>
                <button className="btn-action" onClick={handleNextStep}>Próximo</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card-step">
            <h1 className="title">SELECIONE O ANO</h1>
            <p className="subtitle">Escolha o ano base para a consulta.</p>
            <select 
              className="large-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              autoFocus
            >
              <option value="">Selecione o ano...</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {error && <p className="error-msg">{error}</p>}
            <div className="actions-row">
                <button className="btn-back" onClick={() => setStep(3)}>Voltar</button>
                <button className="btn-action" onClick={handleNextStep} disabled={loading}>
                  {loading ? 'Processando...' : 'Próximo'}
                </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="results-container">
            <div className="results-section">
              <h2 className="results-title">{filterType.toUpperCase()}S</h2>
              {filterType === 'Contra Cheque' ? (
                <p className="total-count">Ano: {year} | Encontrados: {paystubs.length}</p>
              ) : (
                <p className="total-count">Todos os anos disponíveis</p>
              )}

              <div className="paystub-list">
                {paystubs.map((item) => (
                  <div key={item.id} className="paystub-row">
                    <div className="info-col">
                      {filterType === 'Contra Cheque' ? (
                        <span className="month-label"><strong>Mês:</strong> {MONTHS.find(m => m.value === item.month)?.label}</span>
                      ) : (
                        <span className="month-label"><strong>{filterType} {item.year}</strong></span>
                      )}
                    </div>
                    <a href={item.fileUrl} target="_blank" className="download-link">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#83004c"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                      <span>Baixar</span>
                    </a>
                  </div>
                ))}
                {!loading && paystubs.length === 0 && (
                  <div className="no-results-card">
                    <p>Nenhum documento encontrado.</p>
                  </div>
                )}
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Buscando...</span>
                    </div>
                )}
                
                <div className="actions-row footer-actions">
                    <button className="btn-back small" onClick={() => setStep(filterType === 'Contra Cheque' ? 4 : 3)}>Voltar</button>
                    <button className="btn-new-search-minimal" onClick={handleNewSearch}>
                        Nova Consulta
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .public-view-container { max-width: 600px; margin: 40px auto; padding: 20px; font-family: 'Inter', sans-serif; }
        
        .public-header { 
          background: #83004c; 
          color: white; 
          padding: 20px; 
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          box-shadow: 0 4px 15px rgba(131, 0, 76, 0.2);
        }
        .greeting { font-size: 16px; font-weight: 600; margin: 0; }
        
        .content-area { display: flex; flex-direction: column; align-items: center; }
        
        .card-step { text-align: center; width: 100%; max-width: 400px; animation: slideUp 0.3s ease-out; }
        .title { font-size: 22px; color: #1e293b; font-weight: 800; margin-bottom: 8px; margin-top: 20px; }
        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 32px; }
        
        .large-input, .large-select {
          width: 100%;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 20px;
          text-align: center;
          margin-bottom: 24px;
          color: #1e293b;
          font-weight: 700;
          transition: border-color 0.2s;
        }
        .large-input:focus, .large-select:focus { outline: none; border-color: #83004c; }
        
        .btn-action {
          width: 100%;
          padding: 16px;
          background: #83004c;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-action:hover { opacity: 0.9; }
        .btn-action:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .actions-row { display: flex; gap: 12px; width: 100%; }
        .btn-back {
            flex: 1;
            padding: 16px;
            background: white;
            color: #64748b;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-back.small { padding: 10px; font-size: 13px; }

        .type-buttons.vertical { display: flex; flex-direction: column; gap: 12px; }
        .type-btn.large {
          padding: 20px;
          font-size: 18px;
          border-radius: 12px;
          background: white;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          font-weight: 700;
          transition: all 0.2s;
        }
        .type-btn.large:hover { border-color: #83004c; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .type-btn.large.active { background: #83004c; color: white; border-color: #83004c; }

        .results-container { width: 100%; animation: slideUp 0.3s ease-out; }
        .results-title { text-align: center; color: #1e293b; font-weight: 800; margin-bottom: 4px; font-size: 20px; }
        .total-count { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
        
        .paystub-list { display: flex; flex-direction: column; gap: 10px; }
        .paystub-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 14px 20px; 
          background: white;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .month-label { color: #1e293b; font-size: 16px; }
        .month-label strong { color: #83004c; }
        
        .download-link { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          color: #83004c; 
          text-decoration: none; 
          font-weight: 700;
          font-size: 14px;
        }
        
        .footer-actions { margin-top: 32px; flex-direction: column; align-items: center; }
        .btn-new-search-minimal { background: none; border: none; color: #64748b; font-size: 14px; text-decoration: underline; cursor: pointer; }
        .btn-link { background: none; border: none; color: #83004c; font-size: 14px; text-decoration: underline; cursor: pointer; }
        .field-label { display: block; font-size: 11px; font-weight: 800; color: #83004c; margin-bottom: 4px; letter-spacing: 0.05em; }

        .error-msg { color: #ef4444; font-size: 14px; margin-bottom: 16px; font-weight: 500; }
        .loading-state { text-align: center; padding: 20px; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 10px; height: 100vh; justify-content: center; }
        .spinner { width: 24px; height: 24px; border: 3px solid #f1f5f9; border-top-color: #83004c; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
