import { db } from './supabaseClient';


export const Query = db.entities.Query;



// auth sdk:
export const User = db.auth;