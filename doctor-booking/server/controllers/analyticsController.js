const supabase = require('../config/supabase');
const { startOfMonth, subMonths, format, endOfMonth } = require('date-fns');

// GET /api/analytics/patient
const getPatientAnalytics = async (req, res) => {
    try {
        const patientId = req.user.id;

        let { data: mainStats, error: statsError } = await supabase
            .from('patient_analytics')
            .select('*')
            .eq('patient_id', patientId)
            .maybeSingle();

        if (!mainStats) {
            mainStats = {
                total_appointments: 0,
                completed: 0,
                cancelled: 0,
                no_shows: 0,
                total_spent: 0,
                unique_doctors_visited: 0,
                last_appointment_date: null
            };
        }

        // 2. Appointments by month (last 6 months)
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
        const { data: monthlyApps, error: monthlyAppsError } = await supabase
            .from('appointments')
            .select('appointment_date')
            .eq('patient_id', patientId)
            .gte('appointment_date', sixMonthsAgo.toISOString());

        if (monthlyAppsError) throw monthlyAppsError;

        // 3. Spending by month (last 6 months)
        const { data: paymentsWithApps, error: pError } = await supabase
            .from('payments')
            .select('amount, created_at, appointments!inner(patient_id)')
            .eq('appointments.patient_id', patientId)
            .eq('status', 'paid')
            .gte('created_at', sixMonthsAgo.toISOString());

        if (pError) throw pError;

        // 4. Appointments by specialty
        const { data: specialtyData, error: specError } = await supabase
            .from('appointments')
            .select('doctors!inner(specialty)')
            .eq('patient_id', patientId);
        
        if (specError) throw specError;

        // 5. Top Doctors
        const { data: topDocs, error: topError } = await supabase
            .from('appointments')
            .select('doctor_id, doctors!inner(profiles!inner(name, avatar_url))')
            .eq('patient_id', patientId);

        if (topError) throw topError;

        // Processing logic
        const appointments_by_month = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const monthStr = format(date, 'MMM');
            const count = monthlyApps.filter(a => format(new Date(a.appointment_date), 'MMM') === monthStr).length;
            return { month: monthStr, count };
        });

        const spending_by_month = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const monthStr = format(date, 'MMM');
            const total = paymentsWithApps
                .filter(p => format(new Date(p.created_at), 'MMM') === monthStr)
                .reduce((sum, p) => sum + p.amount, 0);
            return { month: monthStr, amount: total };
        });

        const specialtyCounts = (specialtyData || []).reduce((acc, curr) => {
            const spec = curr.doctors.specialty || 'General';
            acc[spec] = (acc[spec] || 0) + 1;
            return acc;
        }, {});
        const appointments_by_specialty = Object.keys(specialtyCounts).map(name => ({ name, value: specialtyCounts[name] }));

        const docCounts = topDocs.reduce((acc, curr) => {
            const id = curr.doctor_id;
            if (!acc[id]) {
                acc[id] = { 
                    name: curr.doctors.profiles.name, 
                    avatar_url: curr.doctors.profiles.avatar_url, 
                    count: 0 
                };
            }
            acc[id].count++;
            return acc;
        }, {});
        const top_doctors = Object.values(docCounts).sort((a, b) => b.count - a.count).slice(0, 3);

        // Health Score Calculation
        const noShowRate = mainStats.total_appointments > 0 ? (mainStats.no_shows / mainStats.total_appointments) * 100 : 0;
        const completionRate = mainStats.total_appointments > 0 ? (mainStats.completed / mainStats.total_appointments) * 100 : 0;
        const health_score = Math.max(0, Math.min(100, Math.round(completionRate - (noShowRate * 2))));

        res.status(200).json({
            ...mainStats,
            appointments_by_month,
            spending_by_month,
            appointments_by_specialty,
            top_doctors,
            health_score,
            health_metrics: { noShowRate, completionRate }
        });
    } catch (error) {
        console.error('Patient Analytics Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// GET /api/analytics/doctor
const getDoctorAnalytics = async (req, res) => {
    try {
        const doctorId = req.user.id;

        // 1. Stats from view
        let { data: mainStats, error: statsError } = await supabase
            .from('doctor_analytics')
            .select('*')
            .eq('doctor_id', doctorId)
            .maybeSingle();

        if (!mainStats) {
            mainStats = {
                total_appointments: 0,
                completed: 0,
                no_shows: 0,
                total_earned: 0,
                unique_patients: 0,
                average_rating: 0
            };
        }

        // 2. Detailed Appts for charts
        const { data: appts, error: appError } = await supabase
            .from('appointments')
            .select('appointment_date, status, patient_id')
            .eq('doctor_id', doctorId);
        
        if (appError) throw appError;

        // 3. Revenue by month
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
        const { data: revData, error: revError } = await supabase
            .from('payments')
            .select('amount, created_at, appointments!inner(doctor_id)')
            .eq('appointments.doctor_id', doctorId)
            .eq('status', 'paid')
            .gte('created_at', sixMonthsAgo.toISOString());
        
        if (revError) throw revError;

        const { data: diagnoses, error: diagError } = await supabase
            .from('prescriptions')
            .select('diagnosis, appointments!inner(doctor_id)')
            .eq('appointments.doctor_id', doctorId);
        
        if (diagError) throw diagError;

        // Processing
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const appointments_by_day_of_week = days.map(day => ({
            day,
            count: appts.filter(a => format(new Date(a.appointment_date), 'EEEE') === day).length
        }));

        const appointments_by_hour = Array.from({ length: 13 }).map((_, i) => {
            const hour = 8 + i;
            return {
                hour: `${hour}:00`,
                count: appts.filter(a => new Date(a.appointment_date).getHours() === hour).length
            };
        });

        const revenue_by_month = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const monthStr = format(date, 'MMM');
            const total = revData
                .filter(r => format(new Date(r.created_at), 'MMM') === monthStr)
                .reduce((sum, r) => sum + r.amount, 0);
            return { month: monthStr, amount: total };
        });

        // Patient retention
        const patientVisitCounts = appts.reduce((acc, curr) => {
            acc[curr.patient_id] = (acc[curr.patient_id] || 0) + 1;
            return acc;
        }, {});
        const returning = Object.values(patientVisitCounts).filter(c => c > 1).length;
        const newPatients = Object.values(patientVisitCounts).filter(c => c === 1).length;
        const patient_retention = [
            { name: 'Returning', value: returning },
            { name: 'New', value: newPatients }
        ];

        const diagCounts = diagnoses.reduce((acc, curr) => {
            const d = curr.diagnosis || 'Generic';
            acc[d] = (acc[d] || 0) + 1;
            return acc;
        }, {});
        const top_diagnoses = Object.keys(diagCounts)
            .map(name => ({ name, count: diagCounts[name] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // No show trend
        const no_show_rate_trend = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const monthStr = format(date, 'MMM');
            const monthAppts = appts.filter(a => format(new Date(a.appointment_date), 'MMM') === monthStr);
            const noShowCount = monthAppts.filter(a => a.no_show).length;
            const rate = monthAppts.length > 0 ? (noShowCount / monthAppts.length) * 100 : 0;
            return { month: monthStr, rate: Math.round(rate) };
        });

        res.status(200).json({
            ...mainStats,
            appointments_by_day_of_week,
            appointments_by_hour,
            revenue_by_month,
            patient_retention,
            top_diagnoses,
            no_show_rate_trend
        });
    } catch (error) {
        console.error('Doctor Analytics Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// GET /api/analytics/admin
const getAdminAnalytics = async (req, res) => {
    try {
        // Platform overview
        const { data: roles, error: rolesError } = await supabase.from('profiles').select('role, created_at');
        if (rolesError) throw rolesError;

        const { data: appts, error: appError } = await supabase.from('appointments').select('status, no_show, appointment_date');
        if (appError) throw appError;

        const { data: revs, error: revError } = await supabase.from('payments').select('amount, status, created_at');
        if (revError) throw revError;

        const thisMonth = startOfMonth(new Date());
        const lastMonth = startOfMonth(subMonths(new Date(), 1));

        const total_users = roles.reduce((acc, curr) => {
            acc[curr.role] = (acc[curr.role] || 0) + 1;
            return acc;
        }, {});

        const new_users_this_month = roles.filter(r => new Date(r.created_at) >= thisMonth).length;
        const new_users_last_month = roles.filter(r => new Date(r.created_at) >= lastMonth && new Date(r.created_at) < thisMonth).length;

        const total_appointments = appts.length;
        const appointments_this_month = appts.filter(a => new Date(a.appointment_date) >= thisMonth).length;
        const completion_rate = total_appointments > 0 ? Math.round((appts.filter(a => a.status === 'completed').length / total_appointments) * 100) : 0;

        const total_revenue = revs.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
        const revenue_this_month = revs.filter(r => r.status === 'paid' && new Date(r.created_at) >= thisMonth).reduce((sum, r) => sum + r.amount, 0);
        const revenue_last_month = revs.filter(r => r.status === 'paid' && new Date(r.created_at) >= lastMonth && new Date(r.created_at) < thisMonth).reduce((sum, r) => sum + r.amount, 0);
        const revenue_growth = revenue_last_month > 0 ? Math.round(((revenue_this_month - revenue_last_month) / revenue_last_month) * 100) : 0;

        // Revenue forecasting
        const monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const mStart = startOfMonth(date);
            const mEnd = endOfMonth(date);
            return revs.filter(r => r.status === 'paid' && new Date(r.created_at) >= mStart && new Date(r.created_at) <= mEnd).reduce((sum, r) => sum + r.amount, 0);
        });
        
        const growthRates = [];
        for (let i = 1; i < monthlyRevenue.length; i++) {
            if (monthlyRevenue[i-1] > 0) growthRates.push((monthlyRevenue[i] - monthlyRevenue[i-1]) / monthlyRevenue[i-1]);
        }
        const avgGrowth = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b) / growthRates.length : 0.05;
        
        const forecasting = [];
        for (let i = 0; i < 3; i++) {
            const lastRev = i === 0 ? monthlyRevenue[5] : forecasting[i - 1].projected_revenue;
            const projected = Math.round(lastRev * (1 + avgGrowth));
            forecasting.push({
                month: format(startOfMonth(subMonths(new Date(), -1 - i)), 'MMM'),
                projected_revenue: projected,
                confidence: avgGrowth > 0.3 ? 'low' : 'high'
            });
        }

        // Doctor Performance
        const { data: docStats, error: docError } = await supabase.from('doctor_analytics').select(`
            *,
            doctor_profile:profiles!doctor_id(name)
        `);
        if (docError) throw docError;

        const doctor_performance = docStats.map(d => ({
            name: d.doctor_profile.name,
            total_appointments: d.total_appointments,
            completion_rate: d.total_appointments > 0 ? Math.round((d.completed / d.total_appointments) * 100) : 0,
            avg_rating: d.average_rating,
            total_earned: d.total_earned,
            no_show_rate: d.total_appointments > 0 ? Math.round((d.no_shows / d.total_appointments) * 100) : 0
        }));

        res.status(200).json({
            overview: {
                total_users, new_users_this_month, new_users_last_month,
                total_appointments, appointments_this_month, completion_rate,
                total_revenue, revenue_this_month, revenue_growth
            },
            forecasting,
            doctor_performance
        });
    } catch (error) {
        console.error('Admin Analytics Error:', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getPatientAnalytics,
    getDoctorAnalytics,
    getAdminAnalytics
};
