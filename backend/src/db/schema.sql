-- 用户表（先最简：你可以后面再加邮箱/密码hash）
create table if not exists users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

-- 存档表：一人一份
create table if not exists saves (
  user_id uuid primary key references users(id) on delete cascade,
  state_json jsonb not null,
  version bigint not null default 0,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 操作幂等表：防止重复请求重复发奖励
create table if not exists ops (
  op_id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_ops_user_id on ops(user_id);
