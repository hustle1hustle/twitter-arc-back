export const handler = async (evt) => {
  const h = evt.path.split("/").pop();
  return {
    statusCode: 302,
    headers: { Location: `/.netlify/functions/rep?u=${h}` }
  };
}; 