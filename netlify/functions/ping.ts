import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      status: "ok",
      message: "API is working!",
      timestamp: new Date().toISOString()
    })
  };
}; 