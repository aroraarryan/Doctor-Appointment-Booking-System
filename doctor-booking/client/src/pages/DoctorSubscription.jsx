import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Check, Shield, Zap, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DoctorSubscription = () => {
    const [plans, setPlans] = useState([]);
    const [mySub, setMySub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [plansRes, subRes] = await Promise.all([
                api.get('/subscriptions/plans'),
                api.get('/subscriptions/my')
            ]);
            setPlans(plansRes.data);
            setMySub(subRes.data);
        } catch (error) {
            console.error('Error fetching subscription data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        try {
            const res = await api.post('/subscriptions/subscribe', 
                { plan_id: planId, billing_cycle: billingCycle }
            );
            
            // In a real Razorpay integration, you'd open the checkout here
            // window.location.href = res.data.shortUrl;
            
            toast.success('Subscription process initiated! Redirecting to payment...');
            // Simulated Success for Demo
            setTimeout(() => {
                toast.success('Subscription activated! (Simulated)');
                fetchData();
            }, 2000);

        } catch (error) {
            toast.error(error.response?.data?.error || 'Subscription failed');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading plans...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="mb-10 md:mb-12 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Elevate Your Practice</h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 px-4">Choose a plan that fits your professional growth and reach more patients.</p>
                
                <div className="flex items-center justify-center gap-4">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-indigo-600' : 'text-gray-400'}`}>Monthly</span>
                    <button 
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-14 h-7 bg-gray-200 rounded-full relative p-1 transition-colors hover:bg-gray-300"
                    >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-indigo-600' : 'text-gray-400'}`}>
                        Yearly <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-[10px] ml-1">Save 20%</span>
                    </span>
                </div>
            </header>

            {mySub && (
                <div className="mb-10 md:mb-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                    <div>
                        <h2 className="text-base md:text-lg font-semibold text-blue-900">Current Plan: {mySub.plan.name}</h2>
                        <p className="text-sm md:text-base text-blue-700">Status: <span className="capitalize font-bold">{mySub.status}</span> • Renews on {new Date(mySub.current_period_end).toLocaleDateString()}</p>
                    </div>
                    <button className="mt-4 md:mt-0 text-blue-600 font-bold hover:underline text-sm uppercase tracking-widest">Manage Billing</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 md:px-0">
                {plans.map((plan) => (
                    <div key={plan.id} className={`relative flex flex-col p-6 md:p-8 bg-white border rounded-[2rem] md:rounded-3xl shadow-sm transition-all hover:shadow-xl ${plan.badge_type === 'gold' ? 'border-yellow-400 md:scale-105 z-10' : 'border-gray-200'}`}>
                        {plan.badge_type === 'platinum' && (
                            <span className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold tracking-widest rounded-full uppercase">Most Popular</span>
                        )}
                        
                        <div className="mb-6 md:mb-8">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline text-gray-900">
                                <span className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    ₹{billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_monthly * 0.8 * 12)}
                                </span>
                                <span className="ml-1 text-lg md:text-xl font-semibold text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                        </div>

                        <ul className="mb-8 space-y-4 flex-1">
                            {plan.badge_type && (
                                <li className="flex items-center text-gray-600">
                                    <Award className={`w-5 h-5 mr-3 ${plan.badge_type === 'platinum' ? 'text-indigo-500' : plan.badge_type === 'gold' ? 'text-yellow-500' : 'text-gray-400'}`} />
                                    <span>{plan.badge_type.toUpperCase()} Verification Badge</span>
                                </li>
                            )}
                            <li className="flex items-center text-gray-600">
                                <Zap className="w-5 h-5 mr-3 text-blue-500" />
                                <span>Priority {plan.priority_listing === 1 ? 'High' : plan.priority_listing === 2 ? 'Medium' : 'Standard'} Listing</span>
                            </li>
                            {Object.entries(plan.features).map(([key, value]) => (
                                <li key={key} className="flex items-center text-gray-600">
                                    <Check className="w-5 h-5 mr-3 text-green-500" />
                                    <span className="capitalize">{key.replace('_', ' ')}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={mySub?.plan_id === plan.id}
                            className={`w-full py-4 px-6 rounded-xl font-bold transition-all ${
                                mySub?.plan_id === plan.id 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : plan.badge_type === 'gold' || plan.badge_type === 'platinum'
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                : 'bg-gray-900 text-white hover:bg-black'
                            }`}
                        >
                            {mySub?.plan_id === plan.id ? 'Active Plan' : 'Get Started'}
                        </button>
                    </div>
                ))}
            </div>

            <section className="mt-20 py-12 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Why upgrade?</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">Verified Professionalism</h4>
                                    <p className="text-gray-600">Badges give patients confidence. Gold and Platinum doctors see 40% higher booking rates.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">Top of Search Results</h4>
                                    <p className="text-gray-600">Be found faster. Higher tier plans place you at the top of patient search results.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 italic text-gray-600 relative">
                        <span className="absolute -top-6 -left-4 text-8xl text-indigo-100 font-serif">“</span>
                        "Switching to the Platinum plan saved me hours of marketing. My calendar is now consistently full, and the premium badge definitely helps in building instant trust with new patients online."
                        <div className="mt-6 font-bold not-italic text-gray-900">— Dr. Sarah Jenkins, Cardiologist</div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DoctorSubscription;
