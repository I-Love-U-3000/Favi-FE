import { createClient } from "@supabase/supabase-js";

export const supabase=createClient(
    "https://jgounylmgjcmlwyzzzhv.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb3VueWxtZ2pjbWx3eXp6emh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzQ2NjAsImV4cCI6MjA3Mzc1MDY2MH0.5cjyGppqNqndilyIjEVnnlhpVPZLQ089Ens0Rur-G_w"
)