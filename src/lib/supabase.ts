import { createClient } from '@supabase/supabase-js';

// 1. 프로젝트 URL
const supabaseUrl = "https://bigxxoehdzpomyyqptdb.supabase.co";

// 2. anon (public) 키 (변수명 끝에 y를 하나 뺐습니다!)
const supabaseAnonKey = "sb_publishable_md-TPyAlws2m9n3umrz0zg_Y1z1P41S"; 
// ※ 위 키는 예시입니다. 대표님 파일(image_6e5dff.png)에 있는 'anon public' 키 전체를 복사해서 이 따옴표 안에 넣어주세요.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);