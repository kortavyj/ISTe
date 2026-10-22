-- Private, service-role-only Discord storage for ISTe.
create table if not exists public.discord_voice_sessions (
 id bigint generated always as identity primary key,
 guild_id text not null, user_id text not null,
 channel_id text not null, category_id text not null default '',
 joined_at timestamptz not null, left_at timestamptz,
 duration_seconds bigint generated always as (
  case when left_at is null then null
  else greatest(0, floor(extract(epoch from (left_at-joined_at)))::bigint) end
 ) stored,
 constraint discord_voice_sessions_time_check check(left_at is null or left_at >= joined_at)
);
create unique index if not exists voice_one_active on public.discord_voice_sessions(guild_id,user_id) where left_at is null;
create index if not exists voice_period on public.discord_voice_sessions(guild_id,joined_at desc);
create index if not exists voice_category on public.discord_voice_sessions(guild_id,category_id,joined_at desc);

create table if not exists public.discord_voice_worker_heartbeats (
 guild_id text primary key, last_seen_at timestamptz not null default now()
);
create table if not exists public.discord_member_reports (
 id bigint generated always as identity primary key,
 guild_id text not null, reporter_user_id text not null,
 target_user_id text not null,
 reason text not null check(char_length(btrim(reason)) between 10 and 2000),
 evidence_url text, status text not null default 'open'
 check(status in ('open','reviewing','resolved','dismissed')),
 reviewed_by text, reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 constraint report_not_self check(reporter_user_id <> target_user_id)
);
create index if not exists report_queue on public.discord_member_reports(guild_id,status,created_at desc);
create index if not exists report_target on public.discord_member_reports(guild_id,target_user_id,created_at desc);
create table if not exists public.discord_voice_room_statuses (
 channel_id text primary key, guild_id text not null,
 category_id text not null, owner_user_id text not null,
 status_key text not null default 'none' check (status_key in
 ('none','cs2','dota2','pubg','minecraft','faceit','looking_one','training','do_not_disturb','chill')),
 updated_at timestamptz not null default now()
);
create index if not exists room_status_owner on public.discord_voice_room_statuses(guild_id,owner_user_id);
alter table public.discord_voice_sessions enable row level security;
alter table public.discord_voice_worker_heartbeats enable row level security;
alter table public.discord_member_reports enable row level security;
alter table public.discord_voice_room_statuses enable row level security;

create or replace function public.discord_submit_member_report(
 p_guild_id text,p_reporter_user_id text,p_target_user_id text,
 p_reason text,p_evidence_url text default null)
returns bigint language plpgsql security invoker set search_path=public as $$
declare v_id bigint;
begin
 if p_guild_id !~ '^[0-9]{17,20}$'
 or p_reporter_user_id !~ '^[0-9]{17,20}$'
 or p_target_user_id !~ '^[0-9]{17,20}$'
 or p_reporter_user_id=p_target_user_id
 or length(btrim(p_reason)) not between 10 and 2000 then
  raise exception 'INVALID_REPORT' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('report:'||p_guild_id||':'||p_reporter_user_id,0));
 if exists(select 1 from public.discord_member_reports
  where guild_id=p_guild_id and reporter_user_id=p_reporter_user_id
  and created_at>now()-interval '1 minute') then
   raise exception 'REPORT_COOLDOWN' using errcode='P0001';
 end if;
 insert into public.discord_member_reports
 (guild_id,reporter_user_id,target_user_id,reason,evidence_url)
 values(p_guild_id,p_reporter_user_id,p_target_user_id,btrim(p_reason),nullif(btrim(p_evidence_url),''))
 returning id into v_id;
 return v_id;
end;
$$;

-- Shared guild lock prevents reconciliation and live transitions from interleaving.
create or replace function public.discord_apply_voice_session(
 p_guild_id text,p_user_id text,p_channel_id text,p_category_id text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare v_current record; v_now timestamptz:=clock_timestamp();
begin
 if p_guild_id !~ '^[0-9]{17,20}$' or p_user_id !~ '^[0-9]{17,20}$'
 or (p_channel_id<>'' and p_channel_id !~ '^[0-9]{17,20}$')
 or (p_category_id<>'' and p_category_id !~ '^[0-9]{17,20}$')
 or (p_channel_id='' and p_category_id<>'') then
  raise exception 'INVALID_VOICE_SESSION' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('voice:'||p_guild_id,0));
 select * into v_current from public.discord_voice_sessions
 where guild_id=p_guild_id and user_id=p_user_id and left_at is null for update;
 if found and v_current.channel_id=p_channel_id and v_current.category_id=p_category_id then
  return jsonb_build_object('unchanged',true);
 end if;
 if v_current.id is not null then
  update public.discord_voice_sessions set left_at=v_now where id=v_current.id;
 end if;
 if p_channel_id<>'' then
  insert into public.discord_voice_sessions(guild_id,user_id,channel_id,category_id,joined_at)
  values(p_guild_id,p_user_id,p_channel_id,p_category_id,v_now);
 end if;
 return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.discord_reconcile_voice_sessions(p_guild_id text,p_members jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare v_last_seen timestamptz; v_closed integer; v_opened integer; v_now timestamptz:=clock_timestamp();
begin
 if p_guild_id !~ '^[0-9]{17,20}$'
 or jsonb_typeof(p_members) is distinct from 'array'
 or jsonb_array_length(p_members)>10000 then
  raise exception 'INVALID_RECONCILIATION' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('voice:'||p_guild_id,0));
 if exists(select 1 from jsonb_array_elements(p_members) m where
  coalesce(m->>'userId','') !~ '^[0-9]{17,20}$'
  or coalesce(m->>'channelId','') !~ '^[0-9]{17,20}$'
  or (coalesce(m->>'categoryId','')<>'' and coalesce(m->>'categoryId','') !~ '^[0-9]{17,20}$')) then
  raise exception 'INVALID_VOICE_MEMBER' using errcode='22023';
 end if;
 select last_seen_at into v_last_seen from public.discord_voice_worker_heartbeats where guild_id=p_guild_id;
 update public.discord_voice_sessions s
 set left_at=case when v_last_seen is not null and v_last_seen>=s.joined_at
 then least(v_now,v_last_seen) else s.joined_at end
 where s.guild_id=p_guild_id and s.left_at is null;
 get diagnostics v_closed=row_count;
 insert into public.discord_voice_sessions(guild_id,user_id,channel_id,category_id,joined_at)
 select p_guild_id,t.member->>'userId',t.member->>'channelId',
 coalesce(t.member->>'categoryId',''),v_now
 from(select distinct on(m->>'userId') m as member
 from jsonb_array_elements(p_members) m
 order by m->>'userId') t;
 get diagnostics v_opened=row_count;
 return jsonb_build_object('closed',v_closed,'opened',v_opened);
end;
$$;

create or replace function public.discord_voice_leaderboard(
 p_guild_id text,p_since timestamptz default null,
 p_category_id text default null,p_limit integer default 10)
returns table(user_id text,seconds bigint)
language sql stable security invoker set search_path=public as $$
 with spans as (
 select s.user_id,greatest(s.joined_at,coalesce(p_since,s.joined_at)) as start_at,
 case when s.left_at is not null then s.left_at
 else least(now(),greatest(s.joined_at,coalesce(h.last_seen_at,s.joined_at))+interval '90 seconds')
 end as end_at
 from public.discord_voice_sessions s
 left join public.discord_voice_worker_heartbeats h on h.guild_id=s.guild_id
 where s.guild_id=p_guild_id and (p_category_id is null or s.category_id=p_category_id)
 )
 select spans.user_id,
 sum(greatest(0,floor(extract(epoch from (end_at-start_at)))::bigint))::bigint as seconds
 from spans group by spans.user_id
 having sum(greatest(0,floor(extract(epoch from (end_at-start_at)))::bigint))>0
 order by seconds desc,spans.user_id
 limit least(greatest(coalesce(p_limit,10),1),25);
$$;
revoke all on function public.discord_submit_member_report(text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.discord_apply_voice_session(text,text,text,text) from public,anon,authenticated;
revoke all on function public.discord_reconcile_voice_sessions(text,jsonb) from public,anon,authenticated;
revoke all on function public.discord_voice_leaderboard(text,timestamptz,text,integer) from public,anon,authenticated;
grant execute on function public.discord_submit_member_report(text,text,text,text,text) to service_role;
grant execute on function public.discord_apply_voice_session(text,text,text,text) to service_role;
grant execute on function public.discord_reconcile_voice_sessions(text,jsonb) to service_role;
grant execute on function public.discord_voice_leaderboard(text,timestamptz,text,integer) to service_role;
