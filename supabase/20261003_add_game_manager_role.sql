alter type public.app_role
  add value if not exists 'game_manager' after 'editor';
