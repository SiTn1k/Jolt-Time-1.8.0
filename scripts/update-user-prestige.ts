/**
 * Script to update user 877462850 to prestige level 1 and level 959
 * Run with: npx tsx scripts/update-user-prestige.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iyxhzisfwcdfhuxuqxso.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUser() {
  const telegramId = '877462850';
  
  console.log(`🔄 Updating user ${telegramId}...`);
  console.log(`   - prestige_level: 1`);
  console.log(`   - level: 959`);
  console.log('');

  try {
    // Update game_progress
    const { data, error } = await supabase
      .from('game_progress')
      .update({
        prestige_level: 1,
        level: 959,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user:', error);
      process.exit(1);
    }

    console.log('✅ User updated successfully!');
    console.log('');
    console.log('📊 New values:');
    console.log(`   - telegram_id: ${data.telegram_id}`);
    console.log(`   - level: ${data.level}`);
    console.log(`   - prestige_level: ${data.prestige_level}`);
    console.log('');
    console.log('🎉 User can now access Academy and has 1 rebirth!');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

updateUser();
