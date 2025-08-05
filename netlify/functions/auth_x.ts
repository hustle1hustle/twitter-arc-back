import type { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey:    process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!
});
const CALLBACK = process.env.TWITTER_CALLBACK!;

/* ---------- STEP 1: redirect ---------- */
export const handler: Handler = async (evt) => {
  // 1. callback comes back with oauth_token + oauth_verifier
  if (evt.queryStringParameters?.oauth_token &&
      evt.queryStringParameters?.oauth_verifier) {

    // get token & secret we stored in cookie
    const reqToken = evt.queryStringParameters.oauth_token;
    const cookieHdr = evt.headers.cookie || "";
    const reqSecret = cookieHdr.match(/reqSecret=([^;]+)/)?.[1];

    if (!reqSecret) {
      return { statusCode: 400, body: "missing token secret" };
    }

    try {
      const { client: logged, accessToken, accessSecret } =
        await client.login(reqToken, reqSecret,
                           evt.queryStringParameters.oauth_verifier);

      // SUCCESS → redirect back to front with handle
      const user = await logged.v2.me();
      return {
        statusCode: 302,
        headers: { Location: `https://rad-toffee-97e32a.netlify.app/?u=${user.data.username}` }
      };
    } catch (e:any) {
      return { statusCode: 401, body: e.message };
    }
  }

  /* ---------- STEP 0: generate auth link ---------- */
  const { url, oauth_token, oauth_token_secret } =
        await client.generateAuthLink(CALLBACK);

  // 15 мин, видим на всём домене
  const cookie = [
    `reqSecret=${oauth_token_secret}`,
    "Max-Age=900",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax"
  ].join("; ");

  return {
    statusCode: 302,
    headers: { "Set-Cookie": cookie, Location: url }
  };
}; 