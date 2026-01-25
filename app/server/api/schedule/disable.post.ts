/**
 * Disable Schedule Item API
 *
 * Called when a video fails to play due to YouTube errors (100, 101, 150, 153).
 * Uses service role to bypass RLS since viewers don't have accounts.
 *
 * POST /api/schedule/disable
 * Body: { scheduleItemId: string, errorCode: number, errorMessage?: string }
 */

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const body = await readBody(event)

  const { scheduleItemId, errorCode, errorMessage } = body

  if (!scheduleItemId) {
    throw createError({
      statusCode: 400,
      message: 'Missing scheduleItemId',
    })
  }

  if (typeof errorCode !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'Missing or invalid errorCode',
    })
  }

  // Only allow specific YouTube error codes that indicate unavailable videos
  const allowedErrorCodes = [100, 101, 150, 153]
  if (!allowedErrorCodes.includes(errorCode)) {
    throw createError({
      statusCode: 400,
      message: `Invalid error code. Allowed: ${allowedErrorCodes.join(', ')}`,
    })
  }

  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      message: 'Supabase configuration missing',
    })
  }

  // Create service role client to bypass RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Update the schedule item to mark it as disabled
    const { error: updateError } = await supabase
      .from('channel_schedules')
      .update({
        is_disabled: true,
        last_error_code: errorCode,
        last_error_message: errorMessage || `YouTube error ${errorCode}`,
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', scheduleItemId)

    if (updateError) {
      console.error('Failed to disable schedule item:', updateError)
      throw createError({
        statusCode: 500,
        message: 'Failed to disable video',
      })
    }

    return { success: true, message: 'Video disabled successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error disabling schedule item:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error',
    })
  }
})
