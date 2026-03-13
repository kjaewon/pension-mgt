import React from 'react';

const ASSET_CLASSES = ['선진국주식', '신흥국주식', '국내주식', '부동산', '채권혼합', '채권', '안전자산', '원자재'];

export default function AssetAllocationGrid({ assets, totalValue }) {
    // Group assets by assetClass
    const allocation = ASSET_CLASSES.map(cls => {
        const classAssets = assets.filter(a => a.assetClass === cls);
        const classValue = classAssets.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0);
        const actualWeight = totalValue > 0 ? (classValue / totalValue) * 100 : 0;
        const targetWeight = classAssets.reduce((sum, a) => sum + (a.targetWeight || 0), 0);
        
        return {
            assetClass: cls,
            classValue,
            actualWeight,
            targetWeight
        };
    }).filter(item => item.classValue > 0 || item.targetWeight > 0);

    const totalTarget = allocation.reduce((sum, item) => sum + item.targetWeight, 0);

    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 mt-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center">
                <div className="mb-2 sm:mb-0">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        🎯 자산군 배분 현황
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        위 목록에서 설정한 개별 목표 비중을 자산종류 단위로 종합하여 보여줍니다.
                    </p>
                </div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm border shadow-sm ${totalTarget === 100
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                    <span>자산군 합계:</span>
                    <span className="text-lg">{totalTarget.toFixed(1)}%</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-5 py-3 text-left">자산종류</th>
                            <th className="px-5 py-3 text-right">평가금액</th>
                            <th className="px-5 py-3 text-right">실제 비중</th>
                            <th className="px-5 py-3 text-right text-indigo-700 bg-indigo-50/30">목표 비중</th>
                            <th className="px-5 py-3 text-right">괴리율 (실제-목표)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allocation.map(item => {
                            const diff = item.actualWeight - item.targetWeight;
                            return (
                                <tr key={item.assetClass} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 text-left font-medium text-gray-900">
                                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold mr-2">{item.assetClass}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right text-gray-700">{item.classValue.toLocaleString()}원</td>
                                    <td className="px-5 py-4 text-right font-medium text-gray-600">{item.actualWeight.toFixed(1)}%</td>
                                    <td className="px-5 py-4 text-right font-bold text-indigo-700 bg-indigo-50/10">{item.targetWeight.toFixed(1)}%</td>
                                    <td className={`px-5 py-4 text-right font-medium ${Math.abs(diff) < 1 ? 'text-gray-500' : diff > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%p
                                    </td>
                                </tr>
                            );
                        })}
                        {allocation.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-5 py-12 text-center text-gray-400 bg-gray-50/20">
                                    자산 목록에 항목이 없거나 목표 비중이 설정되지 않았습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
