import { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      message: "Test function working!",
      timestamp: new Date().toISOString(),
      status: "success"
    })
  };
}; 