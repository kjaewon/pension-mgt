import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AccountManager from './components/AccountManager';
import AssetGrid from './components/AssetGrid';
import AssetAllocationGrid from './components/AssetAllocationGrid';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { supabase } from './lib/supabase';

function MainApp() {
  const { user, signOut } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [assets, setAssets] = useState({});
  const [deposits, setDeposits] = useState({});
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoadingInitialData(true);
      try {
        // 1. Fetch Accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (accountsError) throw accountsError;

        let formattedAccounts = [];
        if (accountsData && accountsData.length > 0) {
           formattedAccounts = accountsData;
        } else {
            // Create default account if none exist
            const { data: defaultAcc, error: insertErr } = await supabase
                .from('accounts')
                .insert([{ user_id: user.id, name: '기본 계좌' }])
                .select()
                .single();
            if (!insertErr && defaultAcc) {
                formattedAccounts = [defaultAcc];
            }
        }

        setAccounts(formattedAccounts);
        if (formattedAccounts.length > 0) {
            setActiveAccount(formattedAccounts[0].id);
        }

        // 2. Fetch Deposits
        const { data: depositsData, error: depositsError } = await supabase
          .from('deposits')
          .select('*');
        
        if (depositsError) throw depositsError;

        const depositsMap = {};
        if (depositsData) {
            depositsData.forEach(d => {
                depositsMap[d.account_id] = Number(d.amount);
            });
        }
        setDeposits(depositsMap);

        // 3. Fetch Assets
        const { data: assetsData, error: assetsError } = await supabase
          .from('assets')
          .select('*');
        
        if (assetsError) throw assetsError;

        const assetsMap = {};
        if (assetsData) {
            assetsData.forEach(a => {
                if (!assetsMap[a.account_id]) assetsMap[a.account_id] = [];
                assetsMap[a.account_id].push({
                    id: a.id,
                    name: a.name,
                    ticker: a.ticker || '',
                    assetClass: a.asset_class,
                    quantity: Number(a.quantity),
                    averagePrice: Number(a.average_price),
                    currentPrice: Number(a.current_price),
                    targetWeight: Number(a.target_weight),
                    upperYield: a.upper_yield !== null ? Number(a.upper_yield) : 0,
                    lowerYield: a.lower_yield !== null ? Number(a.lower_yield) : 0,
                });
            });
        }
        setAssets(assetsMap);

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (!user) {
    return <Login />;
  }

  if (loadingInitialData) {
      return (
          <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
              <div className="text-gray-500 animate-pulse">데이터를 불러오는 중입니다...</div>
          </div>
      );
  }

  const currentAssets = assets[activeAccount] || [];
  const currentDeposit = deposits[activeAccount] || 0;

  const handleAddAccount = async (name) => {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .insert([{ user_id: user.id, name }])
            .select()
            .single();
        if (error) throw error;
        
        setAccounts(prev => [...prev, data]);
        setAssets(prev => ({ ...prev, [data.id]: [] }));
        setDeposits(prev => ({ ...prev, [data.id]: 0 }));
        setActiveAccount(data.id);
    } catch (e) {
        console.error(e);
        alert('계좌 추가 실패');
    }
  };

  const updateDeposit = async (value) => {
    // Optimistic UI Update might be complicated, wait for DB
    try {
        // Upsert logic for deposit
        const { error } = await supabase
            .from('deposits')
            .upsert({ 
                user_id: user.id, 
                account_id: activeAccount, 
                amount: value 
            }, { onConflict: 'user_id,account_id' });
            
        if (error) throw error;
        setDeposits(prev => ({ ...prev, [activeAccount]: value }));
    } catch (e) {
        console.error(e);
        alert('예수금 업데이트 실패');
    }
  };
  const handleRenameAccount = async (id, newName) => {
    try {
        const { error } = await supabase
            .from('accounts')
            .update({ name: newName })
            .eq('id', id);
        
        if (error) throw error;
        
        setAccounts(prev => prev.map(acc => 
            acc.id === id ? { ...acc, name: newName } : acc
        ));
    } catch (e) {
        console.error(e);
        alert('계좌 이름 변경 실패');
    }
  };

  const handleDeleteAccount = async (id) => {
    try {
        // Manually delete child elements directly since the user's schema might be missing ON DELETE CASCADE
        const { error: assetsErr } = await supabase.from('assets').delete().eq('account_id', id);
        if (assetsErr) console.error('Assets deletion error:', assetsErr);

        const { error: depositsErr } = await supabase.from('deposits').delete().eq('account_id', id);
        if (depositsErr) console.error('Deposits deletion error:', depositsErr);

        const { error: accErr } = await supabase.from('accounts').delete().eq('id', id);
        if (accErr) throw accErr;

        // Safely safely update active account outside of the setAccounts callback
        if (id === activeAccount && accounts.length > 1) {
            const nextAcc = accounts.find(a => a.id !== id);
            if (nextAcc) setActiveAccount(nextAcc.id);
        }

        setAccounts(prev => prev.filter(acc => acc.id !== id));
        setAssets(prev => {
            const newAssets = { ...prev };
            delete newAssets[id];
            return newAssets;
        });
        setDeposits(prev => {
            const newDeposits = { ...prev };
            delete newDeposits[id];
            return newDeposits;
        });
        
        alert('계좌 탭이 정상적으로 삭제되었습니다.');
    } catch (e) {
        console.error(e);
        alert('계좌 삭제 실패: ' + (e.message || 'DB 제약 조건 오류일 수 있습니다'));
    }
  };

  const saveAsset = async (assetData) => {
    try {
        // Convert to DB format
        const dbFormat = {
            user_id: user.id,
            account_id: activeAccount,
            name: assetData.name,
            ticker: assetData.ticker || null,
            asset_class: assetData.assetClass,
            quantity: assetData.quantity,
            average_price: assetData.averagePrice,
            current_price: assetData.currentPrice,
            target_weight: assetData.targetWeight,
            upper_yield: assetData.upperYield,
            lower_yield: assetData.lowerYield
        };

        const isNew = String(assetData.id).length < 20; // Basic check: uuid is longer
        let returnedAsset;

        if (!isNew) {
            // Update
            const { data, error } = await supabase
                .from('assets')
                .update(dbFormat)
                .eq('id', assetData.id)
                .select()
                .single();
            if (error) throw error;
            returnedAsset = data;
        } else {
            // Insert
            const { data, error } = await supabase
                .from('assets')
                .insert([dbFormat])
                .select()
                .single();
            if (error) throw error;
            returnedAsset = data;
        }

        const formatted = {
            id: returnedAsset.id,
            name: returnedAsset.name,
            ticker: returnedAsset.ticker || '',
            assetClass: returnedAsset.asset_class,
            quantity: Number(returnedAsset.quantity),
            averagePrice: Number(returnedAsset.average_price),
            currentPrice: Number(returnedAsset.current_price),
            targetWeight: Number(returnedAsset.target_weight),
            upperYield: returnedAsset.upper_yield ? Number(returnedAsset.upper_yield) : 0,
            lowerYield: returnedAsset.lower_yield ? Number(returnedAsset.lower_yield) : 0,
            dailyReturn: assetData.dailyReturn || 0
        };

        setAssets(prev => {
            const accountAssets = prev[activeAccount] || [];
            const existingIndex = accountAssets.findIndex(a => a.id === formatted.id);
            let newAssets;
            if (existingIndex >= 0) {
                newAssets = [...accountAssets];
                newAssets[existingIndex] = formatted;
            } else {
                newAssets = [...accountAssets, formatted];
            }
            return {
                ...prev,
                [activeAccount]: newAssets
            };
        });
    } catch (e) {
        console.error(e);
        alert('종목 저장 실패');
    }
  };

  const deleteAsset = async (id) => {
    try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;
        
        setAssets(prev => ({
            ...prev,
            [activeAccount]: prev[activeAccount].filter(a => a.id !== id)
        }));
    } catch (e) {
        console.error(e);
        alert('종목 삭제 실패');
    }
  }

  const importAssets = async (importedAssets) => {
     try {
         const dbFormats = importedAssets.map(a => ({
             user_id: user.id,
             account_id: activeAccount,
             name: a.name,
             ticker: a.ticker || null,
             asset_class: a.assetClass || '국내주식',
             quantity: a.quantity || 0,
             average_price: a.averagePrice || 0,
             current_price: a.currentPrice || 0,
             target_weight: a.targetWeight || 0,
             upper_yield: a.upperYield || null,
             lower_yield: a.lowerYield || null
         }));

         const { data, error } = await supabase
            .from('assets')
            .insert(dbFormats)
            .select();
            
         if (error) throw error;

         const formattedNewAssets = data.map(returnedAsset => ({
            id: returnedAsset.id,
            name: returnedAsset.name,
            ticker: returnedAsset.ticker || '',
            assetClass: returnedAsset.asset_class,
            quantity: Number(returnedAsset.quantity),
            averagePrice: Number(returnedAsset.average_price),
            currentPrice: Number(returnedAsset.current_price),
            targetWeight: Number(returnedAsset.target_weight),
            upperYield: returnedAsset.upper_yield ? Number(returnedAsset.upper_yield) : 0,
            lowerYield: returnedAsset.lower_yield ? Number(returnedAsset.lower_yield) : 0,
         }));

         setAssets(prev => {
             const accountAssets = prev[activeAccount] || [];
             return {
                 ...prev,
                 [activeAccount]: [...accountAssets, ...formattedNewAssets]
             };
         });
     } catch (e) {
         console.error(e);
         alert('엑셀 데이터 불러오기 실패');
     }
  };

  const updateMultipleAssets = async (newAssetsArray) => {
    // In a real app we would do a bulk update query here.
    // For simplicity, updating local state directly for fetched prices.
    setAssets(prev => ({
      ...prev,
      [activeAccount]: newAssetsArray
    }));
    
    // Fire and forget updates to superbase 
    try {
        const updates = newAssetsArray.map(a => ({
            id: a.id,
            user_id: user.id,
            account_id: activeAccount,
            name: a.name,
            asset_class: a.assetClass,
            current_price: a.currentPrice
        }));
        await supabase.from('assets').upsert(updates);
    } catch (e) {
        console.error('Failed to sync updated prices', e);
    }
  };

  // Derived state calculations
  const totalValue = currentAssets.reduce((sum, asset) => sum + (asset.quantity * asset.currentPrice), 0);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-12">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none tracking-tighter">R</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Portfolio Rebalancer</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-600 hidden sm:block">
              {user.email}
            </div>
            <button
                onClick={signOut}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
                로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <AccountManager
          accounts={accounts}
          activeAccount={activeAccount}
          onSelect={setActiveAccount}
          onAddAccount={handleAddAccount}
          onDeleteAccount={handleDeleteAccount}
          onRenameAccount={handleRenameAccount}
        />

        <Dashboard
          totalValue={totalValue}
          totalDeposit={currentDeposit}
          onUpdateDeposit={updateDeposit}
        />

        <AssetGrid
          assets={currentAssets}
          totalValue={totalValue}
          onSaveAsset={saveAsset}
          onDelete={deleteAsset}
          onImportAssets={importAssets}
          onUpdateMultipleAssets={updateMultipleAssets}
        />

        <AssetAllocationGrid
          assets={currentAssets}
          totalValue={totalValue}
        />
      </main>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#fef2f2', minHeight: '100vh', color: '#991b1b' }}>
          <h2>앱 렌더링 중 오류가 발생했습니다. (Error Boundary)</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', border: '1px solid #fca5a5', padding: '1rem', background: '#fff' }}>
            <summary>오류 상세 내용 보기</summary>
            <strong>{this.state.error && this.state.error.toString()}</strong>
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
