import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const resendApiKey = Deno.env.get("RESEND_API_KEY")

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Security check: ensure the request is authorized (service role usually, or pg_cron)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || authHeader !== `Bearer ${supabaseServiceKey}`) {
    // In a real environment, you might want to authenticate pg_cron requests securely.
    // For now, we enforce service_role key to be passed.
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 1. Get unread notifications for overdue milestones and health changes from the last 24h
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*, users!inner(email, full_name)')
      .in('type', ['milestone_overdue', 'project_health_changed'])
      .eq('read', false)
      .gte('created_at', yesterday.toISOString())

    if (error) {
       console.error("Error fetching notifications:", error)
       return new Response("Database error", { status: 500 })
    }

    if (!notifications || notifications.length === 0) {
      return new Response("No notifications to send", { status: 200 })
    }

    // 2. Group by user
    const notificationsByUser: Record<string, any[]> = {}
    for (const notification of notifications) {
       const email = notification.users.email
       if (!email) continue
       
       if (!notificationsByUser[email]) {
           notificationsByUser[email] = []
       }
       notificationsByUser[email].push(notification)
    }

    // 3. Send emails
    for (const [email, userNotifications] of Object.entries(notificationsByUser)) {
       
       // Separate by type
       const overdue = userNotifications.filter(n => n.type === 'milestone_overdue')
       const health = userNotifications.filter(n => n.type === 'project_health_changed')
       
       const userName = userNotifications[0].users.full_name
       
       let emailBody = `مرحباً ${userName},\n\nلديك ${userNotifications.length} تنبيهات تتطلب انتباهك:\n\n`
       
       if (overdue.length > 0) {
           emailBody += "⚠️ المهام المتأخرة (OVERDUE MILESTONES):\n"
           for (const n of overdue) {
               emailBody += `- ${n.body}\n`
           }
           emailBody += "\n"
       }
       
       if (health.length > 0) {
           emailBody += "🚨 تنبيهات حالة المشاريع (HEALTH ALERTS):\n"
           for (const n of health) {
               emailBody += `- ${n.body}\n`
           }
           emailBody += "\n"
       }
       
       emailBody += `تسجيل الدخول إلى EngiTrack: https://your-domain.com\n`

       console.log(`Sending email to ${email}:\n${emailBody}`)

       // In a real implementation with Resend:
       /*
       if (resendApiKey) {
           await fetch('https://api.resend.com/emails', {
               method: 'POST',
               headers: {
                   'Authorization': `Bearer ${resendApiKey}`,
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                   from: 'EngiTrack <noreply@your-domain.com>',
                   to: [email],
                   subject: `EngiTrack — تحديث يومي ${new Date().toLocaleDateString('ar-EG')}`,
                   text: emailBody
               })
           })
       }
       */
    }

    return new Response(JSON.stringify({ success: true, count: Object.keys(notificationsByUser).length }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error(err)
    return new Response(String(err), { status: 500 })
  }
})
