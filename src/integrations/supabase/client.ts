// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mtudmunbpibdgvxtmygt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dWRtdW5icGliZGd2eHRteWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NjA0MzUsImV4cCI6MjA1MjMzNjQzNX0.yEuzZvIP3M9YZzc9jVUKH2s2A2w3P7ZZteTFdBc17ps";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);