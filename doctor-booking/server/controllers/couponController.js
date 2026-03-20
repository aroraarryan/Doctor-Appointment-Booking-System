const supabase = require('../config/supabase');

// POST /api/coupons (Admin only)
const createCoupon = async (req, res) => {
    try {
        const { error } = await supabase
            .from('coupons')
            .insert([{ ...req.body, created_by: req.user.id }]);

        if (error) throw error;
        res.status(201).json({ message: 'Coupon created successfully' });
    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/coupons/validate
const validateCoupon = async (req, res) => {
    const { code, appointment_amount, doctor_id, is_first_time_patient } = req.body;

    try {
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            return res.status(404).json({ valid: false, message: 'Invalid or inactive coupon code' });
        }

        // Expiry check
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return res.status(400).json({ valid: false, message: 'Coupon not yet valid' });
        }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return res.status(400).json({ valid: false, message: 'Coupon expired' });
        }

        // Usage limit check
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
        }

        // Rules
        if (coupon.applicable_to === 'first_time' && !is_first_time_patient) {
             return res.status(400).json({ valid: false, message: 'Applicable only to first-time patients' });
        }
        if (coupon.applicable_to === 'specific_doctor' && coupon.doctor_id !== doctor_id) {
             return res.status(400).json({ valid: false, message: 'Not applicable for this doctor' });
        }

        // Calculate discount
        let discount_amount = 0;
        if (coupon.discount_type === 'percentage') {
            discount_amount = (appointment_amount * coupon.discount_value) / 100;
            if (coupon.max_discount_amount) {
                discount_amount = Math.min(discount_amount, coupon.max_discount_amount);
            }
        } else {
            discount_amount = Math.min(coupon.discount_value, appointment_amount);
        }

        res.status(200).json({ 
            valid: true, 
            discount_amount, 
            final_amount: appointment_amount - discount_amount,
            coupon_id: coupon.id 
        });

    } catch (error) {
        console.error('Validate Coupon Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/admin/coupons
const getCoupons = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Get Coupons Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createCoupon,
    validateCoupon,
    getCoupons
};
