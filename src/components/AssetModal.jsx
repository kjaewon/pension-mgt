import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ASSET_CLASSES = ['선진국주식', '신흥국주식', '국내주식', '부동산', '채권혼합', '채권', '안전자산', '원자재'];

export default function AssetModal({ isOpen, onClose, onSave, asset }) {
    const [formData, setFormData] = useState({
        name: '',
        ticker: '',
        assetClass: '국내주식',
        quantity: 0,
        averagePrice: 0,
        currentPrice: 0,
        targetWeight: 0,
        upperYield: 0,
        lowerYield: 0,
    });

    useEffect(() => {
        if (asset) {
            setFormData({ ...asset });
        } else {
            setFormData({
                name: '',
                ticker: '',
                assetClass: '국내주식',
                quantity: 0,
                averagePrice: 0,
                currentPrice: 0,
                targetWeight: 0,
                upperYield: 0,
                lowerYield: 0,
            });
        }
    }, [asset, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let parsedValue = value;
            if (e.target.type === 'number') {
                if (value === '' || value === '-') {
                    parsedValue = value;
                } else {
                    parsedValue = Number(value);
                }
            }
            return {
                ...prev,
                [name]: parsedValue
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanedData = {
            ...formData,
            quantity: Number(formData.quantity) || 0,
            averagePrice: Number(formData.averagePrice) || 0,
            currentPrice: Number(formData.currentPrice) || 0,
            targetWeight: Number(formData.targetWeight) || 0,
            upperYield: Number(formData.upperYield) || 0,
            lowerYield: Number(formData.lowerYield) || 0,
        };
        onSave(cleanedData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {asset ? '종목 상세/수정' : '새 종목 추가'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">자산 종류</label>
                            <select
                                name="assetClass"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.assetClass}
                                onChange={handleChange}
                            >
                                {ASSET_CLASSES.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">종목명</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">종목코드 (선택)</label>
                            <input
                                type="text"
                                name="ticker"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.ticker}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                            <input
                                type="number"
                                name="quantity"
                                step="any"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.quantity}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">평단가</label>
                            <input
                                type="number"
                                name="averagePrice"
                                step="any"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.averagePrice}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">현재가</label>
                            <input
                                type="number"
                                name="currentPrice"
                                step="any"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.currentPrice}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">목표 비중 (%)</label>
                            <input
                                type="number"
                                name="targetWeight"
                                step="any"
                                className="w-full border border-indigo-200 bg-indigo-50 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.targetWeight}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">상한수익률 (%)</label>
                            <input
                                type="number"
                                name="upperYield"
                                step="any"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.upperYield}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">하한수익률 (%)</label>
                            <input
                                type="number"
                                name="lowerYield"
                                step="any"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formData.lowerYield}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            {asset ? '저장' : '추가'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
