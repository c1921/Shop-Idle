import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

// ⚠️ 你的 demo 用户 ID，保持与后端一致
const DEMO_USER_ID = process.env.DEMO_USER_ID ?? '11111111-1111-1111-1111-111111111111';

// 你可以把默认存档结构改成你现在的 GameState 默认值
const DEFAULT_STATE = {
  cash: 100,
  inventory: { apple: 0, bread: 0 },
  customer: {
    lastTickAt: new Date().toISOString(),
    ratePerMinute: 6,
    carry: 0,
  },
  stats: {
    sold: { apple: 0, bread: 0 },
    revenue: 0,
    cost: 0,
  },
};

async function main() {
  // 安全保护：只允许开发环境执行（你也可以改成更严格）
  const env = process.env.NODE_ENV ?? 'development';
  if (env !== 'development') {
    console.error(`Refusing to reset in NODE_ENV=${env}. Set NODE_ENV=development to proceed.`);
    process.exit(1);
  }

  // 额外保护：必须显式传入 --yes
  const yes = process.argv.includes('--yes');
  if (!yes) {
    console.error('Dry stop. Re-run with: npm run reset:demo -- --yes');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('begin');

    // 1) 清幂等 ops（同账号）
    await client.query('delete from ops where user_id = $1', [DEMO_USER_ID]);

    // 2) 清存档
    await client.query('delete from saves where user_id = $1', [DEMO_USER_ID]);

    // 3) 确保 user 存在
    await client.query(
      'insert into users(id) values($1) on conflict do nothing',
      [DEMO_USER_ID],
    );

    // 4) 重建默认存档（version=0）
    await client.query(
      `
      insert into saves(user_id, state_json, version, last_seen_at, updated_at)
      values($1, $2::jsonb, 0, now(), now())
      on conflict (user_id) do update
        set state_json = excluded.state_json,
            version = 0,
            last_seen_at = now(),
            updated_at = now()
      `,
      [DEMO_USER_ID, JSON.stringify(DEFAULT_STATE)],
    );

    await client.query('commit');
    console.log(`✅ Reset done for user ${DEMO_USER_ID}`);
  } catch (e) {
    await client.query('rollback');
    console.error('❌ Reset failed:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
