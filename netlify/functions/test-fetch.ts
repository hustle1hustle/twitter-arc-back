import { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  console.log('🧪 Testing fetch...');
  
  try {
    const response = await fetch('https://httpbin.org/json');
    const data = await response.json();
    
    console.log('✅ Fetch successful:', data);
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: "Fetch is working!",
        data: data
      })
    };
  } catch (error) {
    console.log('❌ Fetch failed:', error);
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 