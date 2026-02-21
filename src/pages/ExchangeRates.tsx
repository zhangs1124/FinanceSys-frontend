import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LineChart as LineChartIcon, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RateHistory {
    date: string
    spot_sell_rate: number
    cash_sell_rate: number
}

export function ExchangeRates() {
    const [currencies, setCurrencies] = useState<string[]>([])
    const [selectedCurrency, setSelectedCurrency] = useState('USD')
    const [historyData, setHistoryData] = useState<RateHistory[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [dateRange, setDateRange] = useState<number>(90)  // 預設顯示 90 天
    const itemsPerPage = 15
    const rangeOptions = [
        { label: '1M', days: 30 },
        { label: '3M', days: 90 },
        { label: '6M', days: 180 },
        { label: '1Y', days: 365 },
        { label: '全部', days: 0 },
    ]

    // 1. 取得目前有被設為目標的幣別清單，作為下拉選單選項
    useEffect(() => {
        const fetchAvailableCurrencies = async () => {
            const { data } = await supabase.from('target_currencies').select('code').eq('is_active', true)
            if (data) {
                setCurrencies(data.map(c => c.code))
            }
        }
        fetchAvailableCurrencies()
    }, [])

    // 2. 當選定幣別或時間範圍改變時，重新撈取歷史紀錄
    useEffect(() => {
        const fetchRates = async () => {
            if (!selectedCurrency) return;
            setLoading(true)

            let query = supabase
                .from('exchange_rates')
                .select('date, spot_sell_rate, cash_sell_rate')
                .eq('base_currency', selectedCurrency)

            if (dateRange > 0) {
                const fromDate = new Date(Date.now() - dateRange * 86400000).toISOString().split('T')[0]
                query = query.gte('date', fromDate)
            }

            const { data, error } = await query.order('date', { ascending: true })

            if (!error && data) {
                setHistoryData(data)
                setCurrentPage(1)
            }
            setLoading(false)
        }
        fetchRates()
    }, [selectedCurrency, dateRange])

    const totalPages = Math.ceil(historyData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentTableData = [...historyData].reverse().slice(startIndex, startIndex + itemsPerPage)

    return (
        <>
            <header className="header">
                <h1 className="title">
                    <LineChartIcon style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
                    外幣匯率走勢分析
                </h1>
                <p className="section-desc" style={{ marginTop: '8px' }}>查詢各幣別對新台幣 (TWD) 之即期賣出歷史走勢</p>
            </header>

            <section className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>分析目標幣別：</label>
                    <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none' }}
                    >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {loading && <RefreshCw className="spin" size={20} color="var(--text-secondary)" />}
                    {/* 時間範圍選擇按鈕群 */}
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                        {rangeOptions.map(opt => (
                            <button
                                key={opt.days}
                                onClick={() => setDateRange(opt.days)}
                                style={{
                                    padding: '6px 14px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer',
                                    fontWeight: 600, border: '1px solid var(--border-color)',
                                    background: dateRange === opt.days ? 'var(--accent-color)' : 'transparent',
                                    color: dateRange === opt.days ? 'white' : 'var(--text-secondary)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="chart-container" style={{ minHeight: '350px' }}>
                    {historyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={historyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={val => val.substring(5)} tickMargin={10} />
                                <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} tickFormatter={(val) => val.toFixed(2)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#10b981', fontWeight: 600 }}
                                />
                                <Line type="monotone" dataKey="spot_sell_rate" name="即期賣出價" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (!loading && <div className="loading-container">該幣別目前無歷史資料</div>)}
                </div>
            </section>

            {/* 下方的數據表格 */}
            <section className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>日期 (Date)</th>
                                <th>即期賣出 (Spot Sell)</th>
                                <th>現鈔賣出 (Cash Sell)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTableData.map(row => (
                                <tr key={row.date}>
                                    <td style={{ fontWeight: 600 }}>{row.date}</td>
                                    <td style={{ color: 'var(--success-color)' }}>{row.spot_sell_rate?.toFixed(4) || '-'}</td>
                                    <td>{row.cash_sell_rate?.toFixed(4) || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 分頁控制 */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', gap: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            className="primary-btn"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            上一頁
                        </button>
                        <span style={{ color: 'var(--text-secondary)' }}>第 {currentPage} 頁 / 共 {totalPages} 頁</span>
                        <button
                            className="primary-btn"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            下一頁
                        </button>
                    </div>
                )}
            </section>
        </>
    )
}
