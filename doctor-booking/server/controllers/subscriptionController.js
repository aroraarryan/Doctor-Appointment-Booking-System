const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// GET /api/subscriptions/plans
const getPlans = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('priority_listing', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Get Plans Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/subscriptions/subscribe
const subscribe = async (req, res) => {
    const { plan_id, billing_cycle } = req.body; // billing_cycle: 'monthly' or 'yearly'
    const doctorId = req.user.id;

    try {
        // 1. Get plan details
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', plan_id)
            .single();

        if (planError || !plan) {
            return res.status(404).json({ error: 'Subscription plan not found' });
        }

        // 2. MOCK for now
        const mockSubscriptionId = `sub_${Math.random().toString(36).substr(2, 9)}`;
        const days = billing_cycle === 'yearly' ? 365 : 30;
        const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        
        // Immediately set to active in mock mode
        const { error: subError } = await supabase
            .from('doctor_subscriptions')
            .insert([{
                doctor_id: doctorId,
                plan_id: plan_id,
                razorpay_subscription_id: mockSubscriptionId,
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: periodEnd
            }]);

        if (subError) throw subError;

        // Update doctor profile with badge immediately
        await supabase
            .from('doctors')
            .update({ verification_badge: plan.badge_type })
            .eq('id', doctorId);

        res.status(200).json({ 
            subscriptionId: mockSubscriptionId, 
            shortUrl: `https://rzp.io/i/${mockSubscriptionId}` // Mock URL
        });

    } catch (error) {
        console.error('Subscribe Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/subscriptions/cancel
const cancelSubscription = async (req, res) => {
    const doctorId = req.user.id;

    try {
        const { data: subscription, error: subError } = await supabase
            .from('doctor_subscriptions')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('status', 'active')
            .single();

        if (subError || !subscription) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        // Razorpay cancel call
        // await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id);

        const { error: updateError } = await supabase
            .from('doctor_subscriptions')
            .update({ 
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

        if (updateError) throw updateError;

        res.status(200).json({ message: 'Subscription cancelled successfully. It will remain active until the end of the current period.' });
    } catch (error) {
        console.error('Cancel Subscription Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/subscriptions/my
const getMySubscription = async (req, res) => {
    const doctorId = req.user.id;

    try {
        const { data, error } = await supabase
            .from('doctor_subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('doctor_id', doctorId)
            .in('status', ['active', 'cancelled', 'trial'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Get My Subscription Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Webhook for Razorpay
const handleWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature (Implementation omitted for brevity, but crucial in production)
    
    const event = req.body;
    const { payload } = event;

    try {
        if (event.event === 'subscription.activated') {
            const subId = payload.subscription.entity.id;
            const periodEnd = new Date(payload.subscription.entity.current_end * 1000).toISOString();
            
            // Update subscription
            const { data: sub, error: subError } = await supabase
                .from('doctor_subscriptions')
                .update({ 
                    status: 'active',
                    current_period_end: periodEnd
                })
                .eq('razorpay_subscription_id', subId)
                .select()
                .single();
            
            if (sub) {
                // Get plan details for badge
                const { data: plan } = await supabase.from('subscription_plans').select('badge_type').eq('id', sub.plan_id).single();
                
                // Update doctor profile with badge
                await supabase
                    .from('doctors')
                    .update({ verification_badge: plan.badge_type })
                    .eq('id', sub.doctor_id);
            }
        } else if (event.event === 'subscription.cancelled') {
             const subId = payload.subscription.entity.id;
             await supabase
                .from('doctor_subscriptions')
                .update({ status: 'cancelled' })
                .eq('razorpay_subscription_id', subId);
             
             // Logic to remove badge after period_end would be handled by a cron job or checked on-the-fly
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPlans,
    subscribe,
    cancelSubscription,
    getMySubscription,
    handleWebhook
};
