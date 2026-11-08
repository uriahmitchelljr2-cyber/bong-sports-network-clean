
import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Your Supabase project details
const SUPABASE_URL = 'https://munohwkzlsjorztprzwg.supabase.co';

const SUPABASE_KEY = 'sb_publishable_GrKEhUkNjerz9MBGpax_3A_544QtMXj';

// Create the Supabase connection
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
