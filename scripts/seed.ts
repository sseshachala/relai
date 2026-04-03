/**
 * Relai — Seed Script (Layer 1)
 *
 * Loads realistic test data into Supabase for a given user.
 * Based on real B2BSphere / Organicaphere business scenarios.
 *
 * Usage:
 *   npx tsx scripts/seed.ts --user <supabase-user-id>
 *
 * Find your user ID:
 *   Supabase → Authentication → Users → copy the UUID next to the email
 *
 * Test accounts to seed separately:
 *   sudhi@b2bsphere.com
 *   info@b2bsphere.com
 *   salessupport@organicaphere.com
 *
 * Example:
 *   npx tsx scripts/seed.ts --user 75979ae3-4f72-4258-bdec-a3db310cd2b7
 *
 * Add --clear to wipe existing data first:
 *   npx tsx scripts/seed.ts --user <id> --clear
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌  Missing env vars.')
  console.error('    Make sure .env.local has:')
  console.error('      NEXT_PUBLIC_SUPABASE_URL')
  console.error('      SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

const userIdx = process.argv.indexOf('--user')
const userId  = userIdx !== -1 ? process.argv[userIdx + 1] : null
if (!userId || userId.startsWith('--')) {
  console.error('\n❌  No user ID provided.')
  console.error('    Usage: npx tsx scripts/seed.ts --user <supabase-user-id>\n')
  process.exit(1)
}

const shouldClear = process.argv.includes('--clear')
const supabase    = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ─────────────────────────────────────────────────────────────────────
// SEED DATA — Realistic B2BSphere / Organicaphere scenarios
// ─────────────────────────────────────────────────────────────────────

const NOW    = new Date()
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString()
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3600000).toISOString()
const hoursFromNow = (n: number) => new Date(NOW.getTime() + n * 3600000).toISOString()

// ── Contacts ──────────────────────────────────────────────────────────
const CONTACTS = [
  {
    name: 'Priya Nair',
    email: 'priya.nair@freshfields.com.sg',
    company: 'FreshFields Asia',
    role: 'Head of Procurement',
    sentiment: 'positive',
    last_topic: 'Q3 organic produce bulk order — pricing and delivery schedule for Singapore and KL',
  },
  {
    name: 'Marcus Lim',
    email: 'marcus.lim@greenwave.sg',
    company: 'GreenWave Distribution',
    role: 'CEO',
    sentiment: 'positive',
    last_topic: 'Cold chain logistics partnership proposal across SEA — Q4 launch timeline',
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@techwave.io',
    company: 'TechWave Solutions',
    role: 'VP Sales',
    sentiment: 'neutral',
    last_topic: 'B2B platform integration — API requirements and pricing for enterprise tier',
  },
  {
    name: 'Raj Mehta',
    email: 'raj.mehta@apexfoods.in',
    company: 'Apex Foods India',
    role: 'Director of Operations',
    sentiment: 'positive',
    last_topic: 'Import compliance for organic certification — FSSAI approval process and timeline',
  },
  {
    name: 'Linda Tan',
    email: 'linda.tan@naturalgrocer.com.sg',
    company: 'Natural Grocer SG',
    role: 'Buying Manager',
    sentiment: 'negative',
    last_topic: 'Delayed delivery on last order — escalated to operations team, seeking credit note',
  },
  {
    name: 'James Wong',
    email: 'james.wong@b2bconnect.asia',
    company: 'B2BConnect Asia',
    role: 'Partnership Manager',
    sentiment: 'positive',
    last_topic: 'Referral program structure — 8% commission on qualified leads, quarterly payout',
  },
  {
    name: 'Aisha Patel',
    email: 'aisha.patel@organicco.com',
    company: 'OrganicCo Wholesale',
    role: 'Sales Director',
    sentiment: 'neutral',
    last_topic: 'Competitive pricing review — comparing Relai platform vs direct supplier model',
  },
  {
    name: 'David Koh',
    email: 'david.koh@freshmart.sg',
    company: 'FreshMart Singapore',
    role: 'CEO',
    sentiment: 'positive',
    last_topic: 'Pilot program for 3 FreshMart outlets — organic produce sourcing via Organicaphere',
  },
  {
    name: 'Nurul Huda',
    email: 'nurul@halalsupply.my',
    company: 'Halal Supply Malaysia',
    role: 'Procurement Lead',
    sentiment: 'neutral',
    last_topic: 'Halal certification requirements for imported organic products — Malaysia standards',
  },
  {
    name: 'Chen Wei',
    email: 'chen.wei@sinogreen.com',
    company: 'SinoGreen Import',
    role: 'Regional Manager',
    sentiment: 'positive',
    last_topic: 'Cross-border supply agreement draft — reviewing clause 4.2 on exclusivity terms',
  },
  {
    name: 'Fatima Al-Rashid',
    email: 'fatima@gulffresh.ae',
    company: 'Gulf Fresh UAE',
    role: 'Head of Buying',
    sentiment: 'positive',
    last_topic: 'Dubai Expo sourcing — premium organic basket for hospitality sector, 500 units/week',
  },
  {
    name: 'Tom Bradley',
    email: 'tom.bradley@cleanfood.com.au',
    company: 'CleanFood Australia',
    role: 'Co-founder',
    sentiment: 'neutral',
    last_topic: 'Joint venture discussion — Australian organic produce distribution into SEA markets',
  },
]

// ── Thread snapshots (email summaries) ───────────────────────────────
const THREAD_SNAPSHOTS = [
  {
    thread_id:  'thread_freshfields_001',
    subject:    'RE: Q3 Organic Produce Order — Pricing Confirmation',
    participants: ['priya.nair@freshfields.com.sg', 'salessupport@organicaphere.com'],
    date_from:  daysAgo(5),
    date_to:    daysAgo(2),
    preview_text: 'Hi Sudhi, following our call last week I am ready to confirm the Q3 order. We will need 2 tons of certified organic leafy greens and 500kg of seasonal fruits monthly. Please send the formal proposal with pricing breakdown and delivery schedule for Singapore and KL by Friday...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_greenwave_001',
    subject:    'Cold Chain Partnership — SEA Expansion Proposal',
    participants: ['marcus.lim@greenwave.sg', 'sudhi@b2bsphere.com'],
    date_from:  daysAgo(12),
    date_to:    daysAgo(8),
    preview_text: 'Marcus here from GreenWave. We have been following Organicaphere\'s growth and believe there is a significant opportunity to combine our cold chain network with your organic supply relationships. We currently operate in SG, MY, TH and PH. Proposing a revenue share model — would you be open to a call this week?...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_techwave_001',
    subject:    'B2BSphere Platform Integration — Enterprise API Pricing',
    participants: ['sarah.chen@techwave.io', 'info@b2bsphere.com'],
    date_from:  daysAgo(18),
    date_to:    daysAgo(15),
    preview_text: 'Hi, we are evaluating B2BSphere for our procurement team of 45 users. Key requirements are: ERP integration via API, custom approval workflows, and single sign-on. Can you share enterprise pricing and implementation timeline? We have budget approval for Q4 and need to make a decision by end of month...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_apexfoods_001',
    subject:    'FSSAI Organic Certification — Import Documentation',
    participants: ['raj.mehta@apexfoods.in', 'salessupport@organicaphere.com'],
    date_from:  daysAgo(22),
    date_to:    daysAgo(20),
    preview_text: 'Raj Mehta from Apex Foods. We want to import your certified organic range into India but need to navigate FSSAI requirements. Our compliance team says we need specific documentation from the source farms. Can you provide the organic certification chain and confirm which products have NPOP certification?...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_naturalgrocer_001',
    subject:    'URGENT: Missing delivery — Order #OA-2847',
    participants: ['linda.tan@naturalgrocer.com.sg', 'salessupport@organicaphere.com'],
    date_from:  daysAgo(3),
    date_to:    daysAgo(1),
    preview_text: 'This is the third time in two months we have had a late delivery. Order OA-2847 was due Tuesday and it is now Thursday. Our shelves are empty and we are losing sales. I need a credit note for this order and an explanation of what is going wrong with your logistics...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_freshmart_001',
    subject:    'FreshMart Pilot — 3 Outlet Trial Starting November',
    participants: ['david.koh@freshmart.sg', 'sudhi@b2bsphere.com', 'salessupport@organicaphere.com'],
    date_from:  daysAgo(7),
    date_to:    daysAgo(4),
    preview_text: 'David here. Board has approved the pilot. We want to start with our Orchard, Tampines and JEM outlets in November. Monthly order value estimated at SGD 18,000 across the three locations. Can we sign the pilot agreement this week? I want to announce this to my team before end of month...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_gulffresh_001',
    subject:    'Dubai Hospitality Sourcing — Premium Organic 500 units/week',
    participants: ['fatima@gulffresh.ae', 'sudhi@b2bsphere.com'],
    date_from:  daysAgo(9),
    date_to:    daysAgo(6),
    preview_text: 'Fatima Al-Rashid from Gulf Fresh. We supply 14 five-star hotels in Dubai and are building a premium organic range for our hospitality clients. Looking for a reliable SEA supplier for tropical fruits, specialty greens and herbs. Volume is 500 premium boxes weekly. Can you handle this and what is your export process?...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_b2bconnect_001',
    subject:    'Referral Partnership — Commission Structure Agreed',
    participants: ['james.wong@b2bconnect.asia', 'info@b2bsphere.com'],
    date_from:  daysAgo(14),
    date_to:    daysAgo(11),
    preview_text: 'James from B2BConnect. We have 200+ active buyers in our network who could benefit from your platform. Happy to formalise the referral arrangement at 8% commission on first year revenue for qualified introductions. I have two companies ready to introduce this month — Halal Supply Malaysia and SinoGreen...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_sinogreen_001',
    subject:    'Cross-border Supply Agreement — Exclusivity Clause Review',
    participants: ['chen.wei@sinogreen.com', 'sudhi@b2bsphere.com'],
    date_from:  daysAgo(30),
    date_to:    daysAgo(25),
    preview_text: 'Chen Wei here. Our legal team has reviewed your draft agreement and have concerns about clause 4.2 on exclusivity. We cannot agree to a 24-month exclusive arrangement but would consider 12 months for the China corridor only. Please advise if this is acceptable before we proceed...',
    processing_status: 'success',
  },
  {
    thread_id:  'thread_cleanfood_001',
    subject:    'Joint Venture — Australian Organic into SEA',
    participants: ['tom.bradley@cleanfood.com.au', 'sudhi@b2bsphere.com'],
    date_from:  daysAgo(45),
    date_to:    daysAgo(40),
    preview_text: 'Tom Bradley co-founder of CleanFood. We have premium Australian certified organic produce — macadamia, berries, specialty grains — and no distribution into SEA. Interested in exploring a JV where you handle distribution and we supply product at wholesale. Initial market sizing suggests SGD 2M in year one...',
    processing_status: 'success',
  },
]

// ── Deals ─────────────────────────────────────────────────────────────
const DEALS = [
  {
    thread_id:   'thread_freshfields_001',
    thread_text: 'From: priya.nair@freshfields.com.sg\nTo: salessupport@organicaphere.com\nSubject: Q3 Organic Produce Order\n\nHi Sudhi, ready to confirm the Q3 order. 2 tons certified organic leafy greens + 500kg seasonal fruits monthly. Please send formal proposal with pricing by Friday.',
    is_deal:     true,
    deal_stage:  'active',
    urgency:     'high',
    confidence:  0.94,
    sentiment:   'positive',
    next_action: 'Send formal proposal with pricing breakdown and delivery schedule by Friday — Priya has confirmed budget',
    summary:     'FreshFields Asia Q3 bulk organic order — 2 tons monthly, needs proposal by Friday',
    created_at:  daysAgo(2),
  },
  {
    thread_id:   'thread_freshmart_001',
    thread_text: 'From: david.koh@freshmart.sg\nTo: sudhi@b2bsphere.com\nSubject: FreshMart Pilot\n\nBoard approved the pilot. 3 outlets starting November. SGD 18k/month. Need to sign pilot agreement this week.',
    is_deal:     true,
    deal_stage:  'active',
    urgency:     'high',
    confidence:  0.97,
    sentiment:   'positive',
    next_action: 'Send pilot agreement for signature this week — David has board approval and SGD 18k/month budget confirmed',
    summary:     'FreshMart 3-outlet pilot SGD 18k/month — agreement ready to sign this week',
    created_at:  daysAgo(4),
  },
  {
    thread_id:   'thread_gulffresh_001',
    thread_text: 'From: fatima@gulffresh.ae\nTo: sudhi@b2bsphere.com\nSubject: Dubai Hospitality Sourcing\n\n14 five-star hotels in Dubai. 500 premium organic boxes weekly. Can you handle this?',
    is_deal:     true,
    deal_stage:  'prospect',
    urgency:     'medium',
    confidence:  0.87,
    sentiment:   'positive',
    next_action: 'Confirm export capability and weekly volume capacity — prepare sample box proposal for Gulf Fresh review',
    summary:     'Gulf Fresh Dubai — 500 premium boxes/week for 14 five-star hotels, high value prospect',
    created_at:  daysAgo(6),
  },
  {
    thread_id:   'thread_greenwave_001',
    thread_text: 'From: marcus.lim@greenwave.sg\nTo: sudhi@b2bsphere.com\nSubject: Cold Chain Partnership\n\nProposing revenue share model for cold chain network across SG, MY, TH and PH. Would you be open to a call?',
    is_deal:     true,
    deal_stage:  'prospect',
    urgency:     'medium',
    confidence:  0.82,
    sentiment:   'positive',
    next_action: 'Schedule call with Marcus to explore cold chain partnership terms and SEA coverage',
    summary:     'GreenWave cold chain partnership across 4 SEA markets — revenue share model proposed',
    created_at:  daysAgo(8),
  },
  {
    thread_id:   'thread_techwave_001',
    thread_text: 'From: sarah.chen@techwave.io\nTo: info@b2bsphere.com\nSubject: B2BSphere Enterprise API Pricing\n\n45 users. ERP integration, custom workflows, SSO. Need enterprise pricing and implementation timeline. Q4 budget approved.',
    is_deal:     true,
    deal_stage:  'active',
    urgency:     'high',
    confidence:  0.91,
    sentiment:   'neutral',
    next_action: 'Send enterprise pricing deck and schedule technical discovery call with Sarah\'s team this week',
    summary:     'TechWave 45-user enterprise deal — Q4 budget approved, needs pricing and technical scope',
    created_at:  daysAgo(15),
  },
  {
    thread_id:   'thread_sinogreen_001',
    thread_text: 'From: chen.wei@sinogreen.com\nTo: sudhi@b2bsphere.com\nSubject: Cross-border Supply Agreement\n\nCannot agree to 24-month exclusivity. Would consider 12 months for China corridor only.',
    is_deal:     true,
    deal_stage:  'stalled',
    urgency:     'low',
    confidence:  0.73,
    sentiment:   'neutral',
    next_action: 'Respond to Chen Wei on exclusivity clause — accept 12-month China corridor compromise to unblock deal',
    summary:     'SinoGreen cross-border supply deal stalled on exclusivity clause — 12 vs 24 months',
    created_at:  daysAgo(25),
  },
  {
    thread_id:   'thread_cleanfood_001',
    thread_text: 'From: tom.bradley@cleanfood.com.au\nTo: sudhi@b2bsphere.com\nSubject: Joint Venture Australian Organic into SEA\n\nSGD 2M estimated year one. Premium Australian organic produce. No distribution into SEA yet.',
    is_deal:     true,
    deal_stage:  'stalled',
    urgency:     'low',
    confidence:  0.65,
    sentiment:   'neutral',
    next_action: 'Revisit CleanFood JV — last contact was 40 days ago, send re-engagement note before deal goes cold',
    summary:     'CleanFood Australia JV — SGD 2M year one estimate, no follow-up in 40 days',
    created_at:  daysAgo(40),
  },
  {
    thread_id:   'thread_apexfoods_001',
    thread_text: 'From: raj.mehta@apexfoods.in\nTo: salessupport@organicaphere.com\nSubject: FSSAI Organic Certification Import\n\nNeed NPOP certification documentation for India import. FSSAI compliance required.',
    is_deal:     true,
    deal_stage:  'prospect',
    urgency:     'medium',
    confidence:  0.78,
    sentiment:   'positive',
    next_action: 'Compile NPOP certification documents and send to Raj — confirm which product lines qualify for India import',
    summary:     'Apex Foods India — organic import deal pending FSSAI/NPOP certification documents',
    created_at:  daysAgo(20),
  },
]

// ── Sync runs ─────────────────────────────────────────────────────────
const SYNC_RUNS = [
  {
    status:            'success',
    trigger:           'manual',
    threads_processed: 10,
    deals_found:       6,
    contacts_found:    10,
    started_at:        hoursAgo(2),
    completed_at:      hoursAgo(2),
  },
  {
    status:            'partial',
    trigger:           'cron',
    threads_processed: 8,
    deals_found:       2,
    contacts_found:    4,
    error_message:     '2 threads failed AI analysis — Claude API timeout on large threads',
    started_at:        daysAgo(1),
    completed_at:      daysAgo(1),
  },
  {
    status:            'success',
    trigger:           'onboarding',
    threads_processed: 10,
    deals_found:       5,
    contacts_found:    8,
    started_at:        daysAgo(3),
    completed_at:      daysAgo(3),
  },
]

// ── Calendar events ───────────────────────────────────────────────────
const CALENDAR_EVENTS = [
  {
    event_id:         'cal_freshmart_pilot_review',
    title:            'FreshMart Pilot Agreement Review — David Koh',
    start_time:       hoursFromNow(4),
    end_time:         hoursFromNow(5),
    attendee_emails:  ['david.koh@freshmart.sg', 'sudhi@b2bsphere.com'],
    linked_thread_ids: ['thread_freshmart_001'],
  },
  {
    event_id:         'cal_techwave_discovery',
    title:            'TechWave Enterprise Discovery Call — Sarah Chen',
    start_time:       hoursFromNow(26),
    end_time:         hoursFromNow(27),
    attendee_emails:  ['sarah.chen@techwave.io', 'info@b2bsphere.com'],
    linked_thread_ids: ['thread_techwave_001'],
  },
  {
    event_id:         'cal_greenwave_partnership',
    title:            'GreenWave Cold Chain Partnership Discussion',
    start_time:       hoursFromNow(48),
    end_time:         hoursFromNow(49),
    attendee_emails:  ['marcus.lim@greenwave.sg', 'sudhi@b2bsphere.com'],
    linked_thread_ids: ['thread_greenwave_001'],
  },
]

// ── User settings ─────────────────────────────────────────────────────
const USER_SETTINGS = {
  timezone:             'America/Chicago',
  digest_hour:          7,
  digest_minute:        30,
  email_digest_enabled: true,
  sync_limit:           10,
  keyword_filters:      ['proposal', 'contract', 'invoice', 'agreement', 'pricing', 'order'],
  retention_days:       30,
}

// ── Digest ────────────────────────────────────────────────────────────
const DIGEST_CONTENT = `Three things need your attention today.

Priya Nair at FreshFields is waiting on your Q3 proposal — she confirmed the order and asked for pricing by Friday. That's today. David Koh at FreshMart has board approval for the three-outlet pilot at SGD 18,000/month and wants to sign this week; don't let that momentum cool. Sarah Chen at TechWave has Q4 budget approved for a 45-user enterprise deal and is waiting on pricing — her deadline is end of month.

Two deals are going cold. Chen Wei at SinoGreen has been waiting 25 days for your response on the exclusivity clause — he proposed a reasonable compromise. Tom Bradley at CleanFood hasn't heard from you in 40 days on a SGD 2M joint venture. Even a short reply keeps these alive.

One relationship worth rekindling: Linda Tan at Natural Grocer is frustrated about the delivery issues. A personal call today — before she emails again — turns a complaint into loyalty.`

// ─────────────────────────────────────────────────────────────────────
// SEED FUNCTIONS
// ─────────────────────────────────────────────────────────────────────

async function clearData() {
  console.log('🗑  Clearing existing data for user', userId, '...')
  const tables = ['digests', 'calendar_events', 'thread_snapshots', 'sync_runs', 'deals', 'contacts', 'sync_state', 'user_settings']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) console.warn(`   ⚠ Could not clear ${table}:`, error.message)
    else       console.log(`   ✓ Cleared ${table}`)
  }
}

async function seedContacts() {
  console.log('\n👤  Seeding contacts...')
  for (const c of CONTACTS) {
    const { error } = await supabase.from('contacts').upsert(
      { ...c, user_id: userId },
      { onConflict: 'user_id,email' }
    )
    if (error) console.warn(`   ⚠ ${c.name}:`, error.message)
    else       console.log(`   ✓ ${c.name} — ${c.company}`)
  }
}

async function seedSyncRuns(): Promise<string[]> {
  console.log('\n🔄  Seeding sync runs...')
  const ids: string[] = []
  for (const run of SYNC_RUNS) {
    const { data, error } = await supabase
      .from('sync_runs')
      .insert({ ...run, user_id: userId })
      .select('id')
      .single()
    if (error) { console.warn('   ⚠ sync run:', error.message); continue }
    ids.push(data.id)
    console.log(`   ✓ ${run.trigger} sync — ${run.status} — ${run.threads_processed} threads`)
  }
  return ids
}

async function seedThreadSnapshots(syncRunIds: string[]) {
  console.log('\n📧  Seeding thread snapshots...')
  for (let i = 0; i < THREAD_SNAPSHOTS.length; i++) {
    const snap = THREAD_SNAPSHOTS[i]
    const runId = syncRunIds[i < 6 ? 0 : i < 8 ? 1 : 2] ?? syncRunIds[0]
    const { error } = await supabase.from('thread_snapshots').upsert(
      { ...snap, user_id: userId, sync_run_id: runId },
      { onConflict: 'user_id,thread_id' }
    )
    if (error) console.warn(`   ⚠ ${snap.subject.slice(0, 40)}:`, error.message)
    else       console.log(`   ✓ ${snap.subject.slice(0, 50)}`)
  }
}

async function seedDeals() {
  console.log('\n💼  Seeding deals...')
  for (const deal of DEALS) {
    const { error } = await supabase.from('deals').upsert(
      { ...deal, user_id: userId },
      { onConflict: 'user_id,thread_id' }
    )
    if (error) console.warn(`   ⚠ ${deal.summary.slice(0, 40)}:`, error.message)
    else       console.log(`   ✓ [${deal.deal_stage}] ${deal.summary.slice(0, 55)}`)
  }
}

async function seedCalendarEvents() {
  console.log('\n📅  Seeding calendar events...')
  for (const event of CALENDAR_EVENTS) {
    const { error } = await supabase.from('calendar_events').upsert(
      { ...event, user_id: userId },
      { onConflict: 'user_id,event_id' }
    )
    if (error) console.warn(`   ⚠ ${event.title.slice(0, 40)}:`, error.message)
    else       console.log(`   ✓ ${event.title}`)
  }
}

async function seedSyncState() {
  console.log('\n⚙   Seeding sync state...')
  const { error } = await supabase.from('sync_state').upsert(
    {
      user_id:         userId,
      last_synced_at:  hoursAgo(2),
      last_history_id: '254891',
      threads_synced:  28,
      is_syncing:      false,
      sync_started_at: null,
    },
    { onConflict: 'user_id' }
  )
  if (error) console.warn('   ⚠ sync state:', error.message)
  else       console.log('   ✓ sync state — last synced 2h ago')
}

async function seedUserSettings() {
  console.log('\n🔧  Seeding user settings...')
  const { error } = await supabase.from('user_settings').upsert(
    { ...USER_SETTINGS, user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) console.warn('   ⚠ user settings:', error.message)
  else       console.log('   ✓ timezone: America/Chicago, digest: 7:30am, sync limit: 10')
}

async function seedDigest() {
  console.log('\n📋  Seeding daily digest...')
  const { error } = await supabase.from('digests').insert({
    user_id:      userId,
    content:      DIGEST_CONTENT,
    trigger:      'sync',
    generated_at: hoursAgo(1),
  })
  if (error) console.warn('   ⚠ digest:', error.message)
  else       console.log('   ✓ digest generated 1h ago')
}

// ─────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Relai Seed Script')
  console.log('────────────────────────────────────')
  console.log(`📌  User ID:  ${userId}`)
  console.log(`🗄  Database: ${SUPABASE_URL}`)
  if (shouldClear) console.log('⚠   Mode:     CLEAR + RESEED')
  else             console.log('ℹ   Mode:     UPSERT (safe to re-run)')
  console.log('────────────────────────────────────')

  if (shouldClear) await clearData()

  await seedContacts()
  const syncRunIds = await seedSyncRuns()
  await seedThreadSnapshots(syncRunIds)
  await seedDeals()
  await seedCalendarEvents()
  await seedSyncState()
  await seedUserSettings()
  await seedDigest()

  console.log('\n────────────────────────────────────')
  console.log('✅  Seed complete!\n')
  console.log('   What was loaded:')
  console.log(`   • ${CONTACTS.length} contacts (FreshFields, GreenWave, TechWave, FreshMart...)`)
  console.log(`   • ${DEALS.length} deals (3 active, 2 prospect, 2 stalled, 1 closed)`)
  console.log(`   • ${THREAD_SNAPSHOTS.length} thread snapshots`)
  console.log(`   • ${SYNC_RUNS.length} sync runs (success, partial, onboarding)`)
  console.log(`   • ${CALENDAR_EVENTS.length} calendar events (linked to threads)`)
  console.log('   • 1 cached daily digest')
  console.log('   • User settings (America/Chicago, 7:30am digest)')
  console.log('\n   Open: https://prelai.org/pipeline')
  console.log('────────────────────────────────────\n')
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})
