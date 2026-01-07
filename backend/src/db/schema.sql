-- 鐢ㄦ埛琛紙鍏堟渶绠€锛氫綘鍙互鍚庨潰鍐嶅姞閭/瀵嗙爜hash锛?
create table if not exists users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

-- LinuxDO Connect identity mapping
create table if not exists user_identities (
  linuxdo_id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  username text,
  name text,
  avatar_template text,
  trust_level int,
  active boolean,
  silenced boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_identities_user_id on user_identities(user_id);

-- 瀛樻。琛細涓€浜轰竴浠?
create table if not exists saves (
  user_id uuid primary key references users(id) on delete cascade,
  state_json jsonb not null,
  version bigint not null default 0,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 鎿嶄綔骞傜瓑琛細闃叉閲嶅璇锋眰閲嶅鍙戝鍔?
create table if not exists ops (
  op_id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_ops_user_id on ops(user_id);


