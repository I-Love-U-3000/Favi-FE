export type LoginValues = {
  identifier: string;
  password: string;
  remember: boolean;
};

export type RegisterValues = {
  username: string; 
  password: string;
};

export type ProfileUpdateInput = {
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
}