import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ltvcvqvdgbugzgvqlyds.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dmN2cXZkZ2J1Z3pndnFseWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDIzNDUsImV4cCI6MjA4OTU3ODM0NX0.xThDiKhWfqIa_NJ78IVJX3-WUviMy883MQStJTb8A_Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
