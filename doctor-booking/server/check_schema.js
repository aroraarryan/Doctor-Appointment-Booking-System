const supabase = require('./config/supabase');

async function checkSchemaViaInsert() {
    try {
        // Find a valid patient user_id
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (userError || !users.length) {
            console.error('No users found to test insertion.');
            process.exit(1);
        }
        
        const userId = users[0].id;

        // Insert a temporary record
        const { data, error } = await supabase
            .from('medical_records')
            .insert([{
                patient_id: userId,
                file_name: 'test_file_name',
                file_url: 'test_url',
                file_type: 'image/png',
                file_size: 100
            }])
            .select('*');
        
        if (error) {
            console.error('Insert Error:', error);
            process.exit(1);
        }
        
        if (data && data.length > 0) {
            console.log('Record after insert:', data[0]);
            console.log('All columns:', Object.keys(data[0]));
            
            // Clean up
            await supabase.from('medical_records').delete().eq('id', data[0].id);
        } else {
            console.log('Insert successful but no data returned.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Catch error:', err);
        process.exit(1);
    }
}

checkSchemaViaInsert();
