export default function errorMessage(error: any, statusCode: number): Response {
  let message = `Status Code: ${statusCode} - `;

  if (error instanceof Error) {
    message += error.message;
  } else if (typeof error === 'string') {
    message += error;
  } else if (typeof error === 'object' && error !== null) {
    message += JSON.stringify(error);
  } else {
    message += 'An unknown error occurred.';
  }

  return new Response(JSON.stringify({ error: message }), {
    status: statusCode,
  });
}
