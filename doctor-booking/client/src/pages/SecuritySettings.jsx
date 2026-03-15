import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
    ShieldCheckIcon, 
    DevicePhoneMobileIcon, 
    ComputerDesktopIcon, 
    DeviceTabletIcon,
    QuestionMarkCircleIcon,
    TrashIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const SecuritySettings = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setTwoFAEnabled(user.two_fa_enabled);
            fetchSessions();
        }
    }, [user]);

    const fetchSessions = async () => {
        try {
            const { data } = await api.get('/sessions');
            setSessions(data);
        } catch (err) {
            console.error('Fetch sessions error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        setError('');
        setSuccess('');
        setActionLoading(true);
        try {
            if (!twoFAEnabled) {
                // Enable flow: get OTP first
                await api.post('/2fa/enable');
                setShowOTPInput(true);
                setSuccess('OTP sent to your email. Please verify to enable 2FA.');
            } else {
                // Disable flow: need OTP to confirm
                await api.post('/2fa/enable'); // Re-using same logic to get OTP
                setShowOTPInput(true);
                setSuccess('OTP sent to your email. Please verify to disable 2FA.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setError('');
        setActionLoading(true);
        try {
            if (!twoFAEnabled) {
                await api.post('/2fa/confirm-enable', { otp });
                setTwoFAEnabled(true);
                setSuccess('Two-factor authentication enabled successfully!');
            } else {
                await api.post('/2fa/disable', { otp });
                setTwoFAEnabled(false);
                setSuccess('Two-factor authentication disabled successfully!');
            }
            setShowOTPInput(false);
            setOtp('');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
        } finally {
            setActionLoading(false);
        }
    };

    const revokeSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to revoke this session?')) return;
        
        setActionLoading(true);
        try {
            await api.delete(`/sessions/${sessionId}`);
            setSessions(sessions.filter(s => s.id !== sessionId));
            setSuccess('Session revoked successfully');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to revoke session');
        } finally {
            setActionLoading(false);
        }
    };

    const revokeAllOthers = async () => {
        if (!window.confirm('Sign out of all other devices?')) return;
        
        setActionLoading(true);
        try {
            await api.delete('/sessions/all/others');
            setSessions(sessions.filter(s => s.isCurrent));
            setSuccess('All other sessions revoked successfully');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to revoke sessions');
        } finally {
            setActionLoading(false);
        }
    };

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'mobile': return <DevicePhoneMobileIcon className="w-6 h-6 text-indigo-500" />;
            case 'tablet': return <DeviceTabletIcon className="w-6 h-6 text-indigo-500" />;
            case 'desktop': return <ComputerDesktopIcon className="w-6 h-6 text-indigo-500" />;
            default: return <QuestionMarkCircleIcon className="w-6 h-6 text-gray-400" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Settings</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">{success}</div>}

            {/* 2FA Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500">Protect your account with an extra layer of security</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${twoFAEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {twoFAEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        {!showOTPInput && (
                            <button
                                onClick={handleToggle2FA}
                                disabled={actionLoading}
                                className={`px-4 py-2 rounded-lg font-bold transition ${twoFAEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            >
                                {twoFAEnabled ? 'Disable' : 'Enable'}
                            </button>
                        )}
                    </div>
                </div>

                {showOTPInput && (
                    <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Verify OTP sent to your email</label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="000000"
                                className="px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-32 tracking-widest text-lg font-bold"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                            <button
                                onClick={handleVerify2FA}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => { setShowOTPInput(false); setOtp(''); }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-6">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        When two-factor authentication is enabled, you'll be asked for a 6-digit verification code sent to your registered email address whenever you sign in to a new browser or device.
                    </p>
                </div>
            </div>

            {/* Sessions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <ComputerDesktopIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Active Sessions</h3>
                            <p className="text-sm text-gray-500">Manage your active sessions and signed-in devices</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchSessions}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                        title="Refresh sessions"
                    >
                        <ArrowPathIcon className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading active sessions...</div>
                    ) : sessions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No active sessions found.</div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-50 rounded-full">
                                        {getDeviceIcon(session.device_type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}</span>
                                            {session.isCurrent && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Current Session</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {session.location} • {session.ip_address} • Last active {new Date(session.last_active_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                {!session.isCurrent && (
                                    <button
                                        onClick={() => revokeSession(session.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Revoke session"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={revokeAllOthers}
                        disabled={actionLoading || sessions.length <= 1}
                        className="text-red-600 text-sm font-bold hover:underline disabled:text-gray-400"
                    >
                        Sign out of all other devices
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
