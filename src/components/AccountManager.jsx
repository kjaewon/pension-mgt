import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function AccountManager({ accounts, activeAccount, onSelect, onAddAccount, onDeleteAccount, onRenameAccount }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [editingAccountId, setEditingAccountId] = useState(null);
    const [editAccountName, setEditAccountName] = useState('');
    const [accountToDelete, setAccountToDelete] = useState(null);

    const handleAdd = () => {
        if (newAccountName.trim()) {
            onAddAccount(newAccountName.trim());
            setNewAccountName('');
            setIsAdding(false);
        }
    };

    const handleRename = (id) => {
        const acc = accounts.find(a => a.id === id);
        if (editAccountName.trim() && acc && editAccountName.trim() !== acc.name) {
            if (onRenameAccount) onRenameAccount(id, editAccountName.trim());
        }
        setEditingAccountId(null);
    };

    return (
        <div className="flex items-center space-x-2 border-b border-gray-200 mt-6 overflow-x-auto pb-1">
            {accounts.map(acc => {
                if (editingAccountId === acc.id) {
                    return (
                        <div key={acc.id} className="flex items-center space-x-1 px-2 py-2">
                            <input
                                type="text"
                                autoFocus
                                className="w-24 px-2 py-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={editAccountName}
                                onChange={e => setEditAccountName(e.target.value)}
                                onBlur={() => handleRename(acc.id)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleRename(acc.id);
                                    if (e.key === 'Escape') setEditingAccountId(null);
                                }}
                            />
                        </div>
                    );
                }
                
                return (
                    <button
                        key={acc.id}
                        className={`whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            activeAccount === acc.id
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                        }`}
                        onClick={() => {
                            if (activeAccount === acc.id) {
                                setEditingAccountId(acc.id);
                                setEditAccountName(acc.name);
                            } else {
                                onSelect(acc.id);
                            }
                        }}
                        title={activeAccount === acc.id ? "클릭하여 이름 변경" : ""}
                    >
                        {acc.name}
                    </button>
                );
            })}
            
            {isAdding ? (
                <div className="flex items-center space-x-2 px-2 py-2">
                    <input
                        type="text"
                        autoFocus
                        className="w-32 px-2 py-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="새 계좌 탭 이름"
                        value={newAccountName}
                        onChange={e => setNewAccountName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleAdd();
                            if (e.key === 'Escape') setIsAdding(false);
                        }}
                    />
                    <button onClick={handleAdd} className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded font-medium hover:bg-indigo-700 transition">
                        확인
                    </button>
                    <button onClick={() => setIsAdding(false)} className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded font-medium hover:bg-gray-300 transition">
                        취소
                    </button>
                </div>
            ) : (
                <div className="flex items-center ml-2 space-x-1">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="새 계좌 탭 추가"
                    >
                        <Plus size={18} />
                    </button>
                    <button
                        onClick={() => {
                            if (accounts.length <= 1) {
                                alert("최소 1개의 계좌 탭은 필요합니다.");
                                return;
                            }
                            const activeAcc = accounts.find(a => a.id === activeAccount);
                            setAccountToDelete(activeAcc);
                        }}
                        className="flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="현재 선택된 계좌 탭 삭제"
                    >
                        <Minus size={18} />
                    </button>
                </div>
            )}

            {/* Custom Confirm Modal for Deletion */}
            {accountToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">계좌 삭제 확인</h3>
                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                            정말 <strong>'{accountToDelete.name}'</strong> 계좌 탭을 삭제하시겠습니까?<br />
                            이 계좌에 등록된 모든 종목과 예수금 데이터가 <span className="text-red-600 font-bold">영구적으로 삭제</span>됩니다.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setAccountToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteAccount(accountToDelete.id);
                                    setAccountToDelete(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                            >
                                삭제합니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
