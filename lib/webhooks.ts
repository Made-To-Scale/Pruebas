/**
 * Calls the webhook responsible for kicking off the context and avatar generation process.
 * In a real-world scenario, the URL would come from an environment variable.
 *
 * @param projectId The ID of the project to process.
 * @returns A promise that resolves when the request is sent, or rejects on network error.
 */
export const callCtxAndAvatarsWebhook = async (projectId: string): Promise<void> => {
  // NOTE: The endpoint URL is hardcoded as per the project structure.
  // In a production app, this should be an environment variable.
  const webhookUrl = '/api/run/ctx-and-avatars';

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ project_id: projectId }),
  });

  if (!response.ok) {
    // Attempt to get more info from the response body if available
    const errorBody = await response.text();
    throw new Error(`Webhook failed with status ${response.status}: ${errorBody || 'No additional error info'}`);
  }

  // We don't need to return the body, just confirm the call was accepted (2xx status)
  return;
};
