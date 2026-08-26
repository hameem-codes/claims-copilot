/**
 * Calls the Hugging Face Inference API to generate a text embedding.
 * 
 * Includes retry logic to handle transient errors, specifically 503s which are
 * common on the Hugging Face free tier while the model is loading.
 * Retries up to 3 times with an exponential backoff of 1s, 2s, and 4s.
 * 
 * @param text The input text to embed
 * @returns A promise that resolves to a flat number[] array of length 384
 */
export async function embedText(text: string): Promise<number[]> {
  const url = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5";
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY is missing from environment variables.");
  }

  const maxRetries = 3;
  const backoffDelays = [1000, 2000, 4000];
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned status ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // The HF API can sometimes return a nested array [ [0.1, 0.2, ...] ] 
      // or a flat array [0.1, 0.2, ...]. Handle both to ensure we return a flat number[].
      const flatResult = Array.isArray(result) && Array.isArray(result[0]) 
        ? result[0] 
        : result;

      if (!Array.isArray(flatResult) || flatResult.length !== 384) {
        throw new Error(`Unexpected embedding format or dimension. Expected array of 384 numbers, got length ${flatResult?.length}`);
      }

      return flatResult as number[];

    } catch (error: unknown) {
      lastError = error;

      if (attempt < maxRetries) {
        // Wait for the specified delay before retrying
        await new Promise(resolve => setTimeout(resolve, backoffDelays[attempt]));
      }
    }
  }

  // If all attempts fail, throw a specific error message
  const err = lastError instanceof Error ? lastError : new Error(String(lastError));
  throw new Error(`Embedding failed after 3 retries (Check HUGGINGFACE_API_KEY rate limits or model status): ${err.message}`);
}
