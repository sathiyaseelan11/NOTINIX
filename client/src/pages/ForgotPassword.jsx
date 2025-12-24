import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/auth/otp/send`, { email });
            setStep(2);
            setMessage('OTP sent! Check your email (or server console).');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/auth/password/reset`, { email, otp, newPassword });
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="flex justify-center items-center relative flex-1 h-full">
                <AnimatePresence>
                    {(error || message) && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`absolute top-4 left-0 right-0 mx-auto w-max z-50 px-6 py-2 rounded-full text-white shadow-lg text-sm font-medium backdrop-blur-sm ${error ? 'bg-red-900/90 border border-red-500' : 'bg-green-900/90 border border-green-500'}`}
                        >
                            {error || message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="card w-full max-w-[400px]">
                    <h2 className="text-center mb-4">Reset Password</h2>

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn mt-4" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                            <div className="p-3 bg-[var(--secondary)] rounded-md text-sm text-[var(--muted-foreground)] mb-2">
                                OTP sent to <strong>{email}</strong>
                            </div>
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                className="input text-center text-lg tracking-widest"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                required
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn mt-4" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                onClick={() => setStep(1)}
                            >
                                Change Email
                            </button>
                        </form>
                    )}

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ForgotPassword;
