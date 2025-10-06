import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { phoneNumber, amount } = requestBody

    // Validate input
    if (!phoneNumber || !amount) {
      return new Response(
        JSON.stringify({ error: 'Phone number and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Making M-Pesa request with:', { phoneNumber, amount })

    // Test API connectivity first
    let response;
    try {
      console.log('Attempting to call M-Pesa API...')
      response = await fetch("https://mpesa-stk.giftedtech.co.ke/api/payIbraah", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
        }),
      })
      console.log('API Response status:', response.status)
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()))
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
      throw new Error(`Network error: ${errorMessage}`)
    }

    const responseData = await response.text()
    
    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, data: responseData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error(`Payment API returned ${response.status}: ${responseData}`)
    }
  } catch (error) {
    console.error('Payment processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Payment processing failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})