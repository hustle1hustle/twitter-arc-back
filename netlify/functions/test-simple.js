exports.handler = async () => {
  console.log('🧪 Simple test function invoked');
  
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      message: "Simple function working!",
      timestamp: new Date().toISOString()
    })
  };
}; 