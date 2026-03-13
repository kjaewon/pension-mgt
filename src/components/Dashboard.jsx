import React, { useState } from 'react';
import { Edit2, Check } from 'lucide-react';

export default function Dashboard({ totalValue, totalDeposit, onUpdateDeposit }) {
    const [isEditingDeposit, setIsEditingDeposit] = useState(false);
    const [depositInput, setDepositInput] = useState(totalDeposit.toString());

    // 누적단순수익률 = ((총평가금액 - 실입금금액) / 실입금금액) * 100
    const totalReturn = totalDeposit > 0 ? ((totalValue - totalDeposit) / totalDeposit) * 100 : 0;

    const handleDepositSave = () => {
        const val = Number(depositInput.replace(/[^0-9.-]+/g,""));
        if (!isNaN(val)) {
            onUpdateDeposit(val);
        }
        setIsEditingDeposit(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col justify-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">총 평가금액</h3>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {totalValue.toLocaleString()}원
                </p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col justify-center relative group">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-500">실입금금액 (원금)</h3>
                    {!isEditingDeposit && (
                        <button 
                            onClick={() => {
                                setDepositInput(totalDeposit.toString());
                                setIsEditingDeposit(true);
                            }}
                            className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
                {isEditingDeposit ? (
                    <div className="flex items-center mt-1">
                        <input
                            type="text"
                            autoFocus
                            className="w-full text-2xl font-bold text-gray-900 border-b border-indigo-500 focus:outline-none bg-transparent"
                            value={depositInput}
                            onChange={(e) => setDepositInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDepositSave()}
                        />
                        <button onClick={handleDepositSave} className="ml-2 text-indigo-600 hover:text-indigo-800">
                            <Check size={20} />
                        </button>
                    </div>
                ) : (
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                        {totalDeposit.toLocaleString()}원
                    </p>
                )}
            </div>

            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col justify-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">누적 단순 수익률</h3>
                <p className={`text-3xl font-bold tracking-tight ${totalReturn >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                </p>
            </div>
        </div>
    );
}
