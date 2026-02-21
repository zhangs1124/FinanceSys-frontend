import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database, Plus, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Currency {
    code: string
    is_active: boolean
    description: string
    created_at: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function DataManagement() {
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)
    const [syncStatus, setSyncStatus] = useState<{ msg: string; ok: boolean } | null>(null)
    const [syncing, setSyncing] = useState<string | null>(null)
    const currentYear = new Date().getFullYear()
    const [exchangeYear, setExchangeYear] = useState<number>(currentYear)
    const yearOptions = Array.from({ length: currentYear - 2022 }, (_, i) => currentYear - i) // 今年 ~ 2023

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
    }, [])

    const triggerSync = async (type: 'exchange' | 'fund') => {
        setSyncing(type)
        setSyncStatus(null)
        try {
            let url = `${API_BASE_URL}/api/sync/${type}`
            if (type === 'exchange') {
                url += `?start_year=${exchangeYear}&end_year=${exchangeYear}`
            }
            const res = await fetch(url)
            const result = await res.json()
            setSyncStatus({
                msg: result.status === 'success'
                    ? `✅ ${result.message}`
                    : `❌ 啟動失敗：${result.message}`,
                ok: result.status === 'success'
            })
        } catch {
            setSyncStatus({ msg: `❌ 無法連線至 API 伺服器 (${API_BASE_URL})`, ok: false })
        } finally {
            setSyncing(null)
        }
    }

    return (
        <>
            <header className="header">
                <h1 className="title">
                    <Database style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
                    系統資料管理
                </h1>
                <p className="section-desc" style={{ marginTop: '8px' }}>檢視並修改底層資料庫設定，或執行手動同步</p>
            </header>

            {/* 手動任務控制區塊 */}
            <section className="glass-card" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>⚙️ 手動資料同步控制</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    API 端點：<code style={{ color: '#60a5fa' }}>{API_BASE_URL}</code>
                </p>
                <div style={{ display: 'flex', gap: '16px', marginBottom: syncStatus ? '16px' : '0', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* 匯率爺蟲按鈕 + 年度選單 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className="primary-btn" onClick={() => triggerSync('exchange')} disabled={!!syncing}
                            style={{ background: '#f59e0b', opacity: syncing ? 0.7 : 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {syncing === 'exchange' ? <Loader2 size={16} className="spin" /> : null}
                            🔄 匯率爬蟲
                        </button>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>年度：</label>
                        <select
                            value={exchangeYear}
                            onChange={(e) => setExchangeYear(Number(e.target.value))}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none' }}
                        >
                            {yearOptions.map(y => <option key={y} value={y}>{y} 年</option>)}
                        </select>
                    </div>
                    {/* 基金爬蟲按鈕 */}
                    <button className="primary-btn" onClick={() => triggerSync('fund')} disabled={!!syncing}
                        style={{ background: '#3b82f6', opacity: syncing ? 0.7 : 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {syncing === 'fund' ? <Loader2 size={16} className="spin" /> : null}
                        🔄 基金爬蟲
                    </button>
                </div>
                {syncStatus && (
                    <div style={{
                        padding: '12px 16px', borderRadius: '10px', marginTop: '12px',
                        background: syncStatus.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${syncStatus.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: syncStatus.ok ? 'var(--success-color)' : '#ef4444', fontSize: '0.9rem'
                    }}>
                        {syncStatus.msg}
                    </div>
                )}
            </section>

            <section className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>🪙 幣別設定管理表</h2>
                    <button className="primary-btn">
                        <Plus size={16} style={{ marginRight: '6px' }} /> 新增幣別
                    </button>
                </div>

                <div className="data-table-container">
                    {loading ? (
                        <div className="loading-container">讀取資料中...</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>狀態 (Status)</th>
                                    <th>幣別代碼 (Code)</th>
                                    <th>中文描述 (Description)</th>
                                    <th>建立時間 (Created At)</th>
                                    <th>操作 (Actions)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currencies.map(row => (
                                    <tr key={row.code}>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className={`status-toggle-btn ${row.is_active ? 'on' : 'off'}`}
                                                onClick={() => toggleCurrency(row.code, row.is_active)}
                                                title="點擊切換狀態"
                                            >
                                                {row.is_active ? <CheckCircle2 color="var(--success-color)" /> : <XCircle color="var(--text-secondary)" />}
                                            </button>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{row.code}</td>
                                        <td>{row.description}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(row.created_at).toLocaleString('zh-TW', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td>
                                            <button className="danger-btn" title="刪除此紀錄">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </>
    )
}
