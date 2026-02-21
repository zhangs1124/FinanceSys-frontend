import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, Settings, RefreshCw, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Currency {
    code: string
    is_active: boolean
    description: string
}

interface ChartDataPoint {
    date: string
    rate: number
}

export function Dashboard() {
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])

    const fetchCurrencies = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('target_currencies')
            .select('*')
            .order('code')

        if (error) console.error('Error fetching currencies:', error)
        else setCurrencies(data || [])
        setLoading(false)
    }

    const fetchExchangeRates = async () => {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('date, spot_sell_rate')
            .eq('base_currency', 'USD')
            .order('date', { ascending: false })
            .limit(30)

        if (error) {
            console.error('Error fetching rates:', error)
        } else if (data) {
            const formattedData = [...data].reverse().map(item => ({
                date: item.date.substring(5),
                rate: item.spot_sell_rate
            }))
            setChartData(formattedData)
        }
    }

    const toggleCurrency = async (code: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('target_currencies')
            .update({ is_active: !currentStatus })
            .eq('code', code)

        if (!error) {
            setCurrencies(prev => prev.map(c =>
                c.code === code ? { ...c, is_active: !currentStatus } : c
            ))
        }
    }

    useEffect(() => {
        fetchCurrencies()
        fetchExchangeRates()
    }, [])

    return (
        <>
            <header className="header">
                <h1 className="title">
                    <Activity className="icon-pulse" style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
                    Exchange & Fund 戰情室
                </h1>
            </header>

            <div className="dashboard-grid">
                <section className="glass-card">
                    <h2 className="section-title">
                        <Settings style={{ marginRight: '8px' }} size={24} color="#3b82f6" />
                        爬蟲幣別自動化設定
                    </h2>
                    <p className="section-desc">
                        點擊可切換啟用狀態。當每日排程執行時，將依照此名單進行資料同步。
                    </p>

                    {loading ? (
                        <div className="loading-container"><RefreshCw className="spin" /></div>
                    ) : (
                        <div className="currency-list">
                            {currencies.map(c => (
                                <div
                                    key={c.code}
                                    className={`toggle-item ${c.is_active ? 'active' : ''}`}
                                    onClick={() => toggleCurrency(c.code, c.is_active)}
                                >
                                    <div className="currency-info">
                                        <span className="currency-code">{c.code}</span>
                                        <span className="currency-desc">{c.description}</span>
                                    </div>
                                    <div className="status-badge">
                                        {c.is_active ? '啟用中' : '已停用'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="glass-card chart-section">
                    <h2 className="section-title">
                        <TrendingUp style={{ marginRight: '8px' }} size={24} color="#10b981" />
                        USD/TWD 美金匯率走勢 (近 30 筆)
                    </h2>

                    <div className="chart-container">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(2)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#10b981', fontWeight: 600 }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rate"
                                        name="即期賣出匯率"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="loading-container">
                                <RefreshCw className="spin" style={{ marginRight: '8px' }} /> 讀取資料中...
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    )
}
