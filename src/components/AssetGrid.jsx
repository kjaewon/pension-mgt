import React, { useState, useRef } from 'react';
import { Trash2, Plus, Upload, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import AssetModal from './AssetModal';

export default function AssetGrid({ assets, totalValue, onSaveAsset, onDelete, onImportAssets, onUpdateMultipleAssets }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
    const fileInputRef = useRef(null);

    const handleAddClick = () => {
        setSelectedAsset(null);
        setIsModalOpen(true);
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                '자산종류': '국내주식',
                '종목명': '삼성전자',
                '종목코드': '005930',
                '평단가': 60000,
                '수량': 100,
                '현재가': 70000,
                '목표비중(%)': 10,
                '상한수익률(%)': 15,
                '하한수익률(%)': -5,
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        // 컬럼 너비 약간 조정
        ws['!cols'] = [{wch:15}, {wch:20}, {wch:15}, {wch:12}, {wch:10}, {wch:12}, {wch:12}, {wch:15}, {wch:15}];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "종목업로드양식");
        XLSX.writeFile(wb, "portfolio_assets_template.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const parsedData = XLSX.utils.sheet_to_json(sheet);

                const newAssets = parsedData.map(row => ({
                    assetClass: row['자산종류'] || '국내주식',
                    name: row['종목명'] || '이름없음',
                    ticker: row['종목코드']?.toString() || '',
                    quantity: Number(row['수량']) || 0,
                    averagePrice: Number(row['평단가']) || 0,
                    currentPrice: Number(row['현재가']) || 0,
                    targetWeight: Number(row['목표비중(%)']) || 0,
                    upperYield: Number(row['상한수익률(%)']) || 0,
                    lowerYield: Number(row['하한수익률(%)']) || 0,
                }));

                if (newAssets.length > 0 && onImportAssets) {
                    onImportAssets(newAssets);
                    alert(`${newAssets.length}건의 종목이 성공적으로 업로드되었습니다.`);
                } else if (newAssets.length === 0) {
                    alert('업로드할 데이터가 없습니다.');
                }
            } catch (error) {
                console.error("Excel parse error", error);
                alert("엑셀 파일을 읽는 도중 오류가 발생했습니다. 양식을 확인해주세요.");
            } finally {
                // Reset file input
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleRowDoubleClick = (asset) => {
        setSelectedAsset(asset);
        setIsModalOpen(true);
    };

    const handleSave = (assetData) => {
        if (selectedAsset) {
            onSaveAsset({ ...assetData, id: selectedAsset.id });
        } else {
            onSaveAsset({ ...assetData, id: Date.now().toString() });
        }
        setIsModalOpen(false);
    };

    const fetchCurrentPrices = async () => {
        if (!onUpdateMultipleAssets) return;
        setIsUpdatingPrices(true);
        let updatedCount = 0;
        const newAssets = [...assets];
        
        for (let i = 0; i < newAssets.length; i++) {
            const asset = newAssets[i];
            if (asset.ticker && asset.ticker.trim() !== '') {
                try {
                    // Attempt to fetch price from Naver Finance via proxy
                    const response = await fetch(`/api/naver-finance/api/stock/${asset.ticker.trim()}/basic`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.closePrice) {
                            // Parse string price like "75,000" to number
                            const newPriceStr = data.closePrice.toString().replace(/,/g, '');
                            const newPrice = Number(newPriceStr);
                            const newDailyReturn = Number(data.fluctuationsRatio) || 0;
                            
                            if (!isNaN(newPrice) && newPrice > 0) {
                                newAssets[i] = { ...asset, currentPrice: newPrice, dailyReturn: newDailyReturn };
                                updatedCount++;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching price for ${asset.ticker}:`, error);
                }
            }
        }
        
        if (updatedCount > 0) {
            onUpdateMultipleAssets(newAssets);
            alert(`${updatedCount}개 종목의 현재가를 갱신했습니다.`);
        } else {
            alert('종목코드가 등록된 자산의 주가를 가져올 수 없습니다.');
        }
        setIsUpdatingPrices(false);
    };

    const totalTargetWeight = assets.reduce((sum, a) => sum + (a.targetWeight || 0), 0);

    return (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-0 space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">보유 종목 목록</h2>
                    <div className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border self-start sm:self-auto ${totalTargetWeight === 100 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                        목표 비중 합계: {totalTargetWeight.toFixed(1)}%
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-3 sm:mt-0">
                    <button
                        onClick={fetchCurrentPrices}
                        disabled={isUpdatingPrices}
                        className={`w-full sm:w-auto justify-center bg-white border px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm ${
                            isUpdatingPrices 
                                ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                                : 'text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                        title="종목코드가 입력된 자산의 현재가를 갱신합니다"
                    >
                        <RefreshCw size={16} className={`mr-1 ${isUpdatingPrices ? 'animate-spin' : ''}`} /> 
                        {isUpdatingPrices ? '갱신 중...' : '현재가 갱신'}
                    </button>
                    
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full sm:w-auto justify-center bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-gray-50 transition-colors shadow-sm"
                        title="엑셀 업로드 양식 파일 다운로드"
                    >
                        <Download size={16} className="mr-1" /> 양식 다운로드
                    </button>
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto justify-center bg-white text-green-700 border border-green-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-green-50 transition-colors shadow-sm"
                        title="작성한 엑셀 파일 일괄 등록"
                    >
                        <Upload size={16} className="mr-1" /> 엑셀 업로드
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".xlsx, .xls, .csv" 
                        className="hidden" 
                    />
                    
                    <button
                        onClick={handleAddClick}
                        className="w-full sm:w-auto justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={16} className="mr-1" /> 추가
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-center whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left">종목명(코드/종류)</th>
                            <th className="px-4 py-3 text-right">수량</th>
                            <th className="px-4 py-3 text-right">평단가</th>
                            <th className="px-4 py-3 text-right">현재가</th>
                            <th className="px-4 py-3 text-right">평가금액</th>
                            <th className="px-4 py-3 text-right">누적수익률</th>
                            <th className="px-4 py-3 text-right">금일등락</th>
                            <th className="px-4 py-3 text-right">현재 비중</th>
                            <th className="px-4 py-3 text-right text-indigo-700 bg-indigo-50/30">목표 비중</th>
                            <th className="px-4 py-3 text-center border-l border-gray-100">리밸런싱 액션</th>
                            <th className="px-4 py-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {assets.map(asset => {
                            const value = asset.quantity * asset.currentPrice;
                            const cost = asset.quantity * asset.averagePrice;
                            const ret = cost > 0 ? ((value - cost) / cost) * 100 : 0;
                            const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
                            
                            const targetVal = totalValue * ((asset.targetWeight || 0) / 100);
                            const diffVal = targetVal - value;
                            let actionQuantity = 0;
                            if (asset.currentPrice > 0) {
                                actionQuantity = diffVal / asset.currentPrice;
                            }
                            const isBuy = diffVal > 0;
                            const isSell = diffVal < 0;
                            const isOutOfRange = (asset.upperYield && ret > asset.upperYield) || (asset.lowerYield && ret < asset.lowerYield);
                            
                            const dailyReturn = asset.dailyReturn || 0;

                            return (
                                <tr 
                                    key={asset.id} 
                                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                                    onDoubleClick={() => handleRowDoubleClick(asset)}
                                >
                                    <td className="px-4 py-3 text-left">
                                        <div className="font-medium text-gray-900">{asset.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {asset.ticker && <span className="mr-1 inline-block">{asset.ticker}</span>}
                                            <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">{asset.assetClass}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700">{asset.quantity.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-700">{asset.averagePrice.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 border-r border-gray-50">{asset.currentPrice.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-800">{value.toLocaleString()}원</td>
                                    <td className={`px-4 py-3 text-right font-medium ${ret >= 0 ? 'text-red-500' : 'text-blue-500'} ${isOutOfRange ? 'bg-yellow-100' : ''}`}>
                                        {ret > 0 ? '+' : ''}{ret.toFixed(2)}%
                                    </td>
                                    <td className={`px-4 py-3 text-right font-medium ${dailyReturn > 0 ? 'text-red-500' : dailyReturn < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {dailyReturn > 0 ? '+' : ''}{dailyReturn.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-600">{weight.toFixed(1)}%</td>
                                    <td className="px-4 py-3 text-right font-bold text-indigo-700 bg-indigo-50/10">{(asset.targetWeight || 0).toFixed(1)}%</td>
                                    
                                    <td className="px-4 py-3 text-center border-l border-gray-100">
                                        {Math.abs(actionQuantity) >= 1 ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold shadow-sm ${isBuy ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                    {isBuy ? '매수' : '매도'} {Math.floor(Math.abs(actionQuantity))}주
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-1">{Math.floor(Math.abs(diffVal)).toLocaleString()}원</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 font-medium text-xs">- 유지 -</span>
                                        )}
                                    </td>
                                    
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(asset.id);
                                            }} 
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {assets.length === 0 && (
                            <tr>
                                <td colSpan="11" className="px-5 py-12 text-center text-gray-500 bg-gray-50/30">
                                    <div className="flex flex-col items-center justify-center">
                                        <p className="mb-1 text-gray-600 font-medium">등록된 종목이 없습니다.</p>
                                        <p className="text-xs text-gray-400">+ 추가 버튼을 눌러 자산을 등록해보세요.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <AssetModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                asset={selectedAsset} 
            />
        </div>
    );
}
