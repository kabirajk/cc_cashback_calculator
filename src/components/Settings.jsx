import { useState } from 'react';
import { saveSettings, exportAllData, importAllData, clearAllData } from '../utils/storage';

function Settings({ settings, onRefresh }) {
    const [billingCycleStart, setBillingCycleStart] = useState(settings.billingCycleStart);
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState('');

    const handleSaveBillingCycle = () => {
        const newSettings = { ...settings, billingCycleStart: parseInt(billingCycleStart) };
        saveSettings(newSettings);
        onRefresh();
        alert('Settings saved!');
    };

    const handleExport = () => {
        const data = exportAllData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cashback-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const result = importAllData(importData);
        if (result.success) {
            alert('Data imported successfully!');
            setShowImport(false);
            setImportData('');
            onRefresh();
        } else {
            alert(`Import failed: ${result.error}`);
        }
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            if (window.confirm('Really delete everything?')) {
                clearAllData();
                onRefresh();
                alert('All data cleared.');
            }
        }
    };

    // Generate days 1-28 for billing cycle start
    const days = Array.from({ length: 28 }, (_, i) => i + 1);

    return (
        <div>
            <h3 className="mb-4">Settings</h3>

            {/* Billing Cycle Start */}
            <div className="card">
                <div className="card-title mb-2">Billing Cycle Start Day</div>
                <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                    Set the day of the month when your billing cycle starts
                </p>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <select
                        className="form-select"
                        value={billingCycleStart}
                        onChange={(e) => setBillingCycleStart(e.target.value)}
                        style={{ flex: 1 }}
                    >
                        {days.map(day => (
                            <option key={day} value={day}>
                                {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of every month
                            </option>
                        ))}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveBillingCycle}>
                        Save
                    </button>
                </div>
            </div>

            {/* Data Management */}
            <div className="card">
                <div className="card-title mb-4">Data Management</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={handleExport}>
                        📤 Export Data (Backup)
                    </button>

                    <button className="btn btn-secondary" onClick={() => setShowImport(!showImport)}>
                        📥 Import Data (Restore)
                    </button>

                    {showImport && (
                        <div className="mt-2">
                            <textarea
                                className="form-input"
                                placeholder="Paste your backup JSON here..."
                                rows={5}
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                            />
                            <button
                                className="btn btn-primary btn-block mt-2"
                                onClick={handleImport}
                                disabled={!importData.trim()}
                            >
                                Import
                            </button>
                        </div>
                    )}

                    <button className="btn btn-danger" onClick={handleClearData}>
                        🗑️ Clear All Data
                    </button>
                </div>
            </div>

            {/* Privacy Info */}
            <div className="card">
                <div className="card-title mb-2">🔒 Privacy</div>
                <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                    All your data is stored locally on your device using localStorage.
                    No data is sent to any server. Your financial information stays
                    private and secure on your device.
                </p>
            </div>

            {/* About */}
            <div className="card">
                <div className="card-title mb-2">About</div>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    CC Cashback Calculator v1.0.0<br />
                    A privacy-focused PWA for tracking credit card cashback.
                </p>
            </div>
        </div>
    );
}

export default Settings;
