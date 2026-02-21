import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PieChart as PieChartIcon, RefreshCw, Layers } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FundInfo {
    cnyes_id: string
    display_name: string
    currency: string
}

interface FundHistory {
    price_date: string
    nav: number
}

export function Funds() {
    const [funds, setFunds] = useState<FundInfo[]>([])
    const [selectedFundId, setSelectedFundId] = useState('')
    const [historyData, setHistoryData] = useState<FundHistory[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // 1. 取得擁有的基金清單，做為下拉選單
    useEffect(() => {
        const fetchFunds = async () => {
            const { data } = await supabase.from('fund_data').select('cnyes_id, display_name, currency')
            if (data && data.length > 0) {
                setFunds(data)
                setSelectedFundId(data[0].cnyes_id) // 預設選擇第一檔
            }
        }
        fetchFunds()
    }, [])

    // 2. 當選定基金改變時，重新撈取該基金的歷史淨值 (fund_nav_history)
    useEffect(() => {
        const fetchHistory = async () => {
            if (!selectedFundId) return;
            setLoading(true)
            const { data, error } = await supabase
                .from('fund_nav_history')
                .select('price_date, nav')
                .eq('cnyes_id', selectedFundId)
                .order('price_date', { ascending: false })
                .limit(90) // 取近 90 筆作圖

            if (!error && data) {
                setHistoryData([...data].reverse()) // 反轉時間軸
                setCurrentPage(1)
            }
            setLoading(false)
        }
        fetchHistory()
    }, [selectedFundId])

    const totalPages = Math.ceil(historyData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentTableData = [...historyData].reverse().slice(startIndex, startIndex + itemsPerPage)

    return (
        <>
            <header className="header">
                <h1 className="title">
                    <PieChartIcon style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
                    基金淨值分析
                </h1>
                <p className="section-desc" style={{ marginTop: '8px' }}>查詢各檔基金之歷史淨值走勢與績效紀錄</p>
            </header>

            <section className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>分析目標基金：</label>
                    <select
                        value={selectedFundId}
                        onChange={(e) => setSelectedFundId(e.target.value)}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none', maxWidth: '400px', cursor: 'pointer' }}
                    >
                        {funds.map(f => <option key={f.cnyes_id} value={f.cnyes_id}>{f.display_name} ({f.currency})</option>)}
                    </select>
                    {loading && <RefreshCw className="spin" size={20} color="var(--text-secondary)" />}
                </div>

                <div className="chart-container" style={{ minHeight: '350px' }}>
                    {historyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={historyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="price_date" stroke="#94a3b8" fontSize={12} tickFormatter={val => val.substring(5)} tickMargin={10} />
                                <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} tickFormatter={(val) => val.toFixed(2)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="nav"
                                    name="基金淨值"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={historyData.length === 1 ? { r: 6 } : false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (!loading && <div className="loading-container">
                        <Layers size={48} opacity={0.3} style={{ display: 'block', margin: '0 auto 10px' }} />
                        此基金目前尚未累積歷史資料
                    </div>)}
                </div>
            </section>

            <section className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>淨值日期 (Price Date)</th>
                                <th>基金淨值 (NAV)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTableData.map(row => (
                                <tr key={row.price_date}>
                                    <td style={{ fontWeight: 600 }}>{row.price_date}</td>
                                    <td style={{ color: 'var(--accent-color)' }}>{row.nav?.toFixed(4) || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
