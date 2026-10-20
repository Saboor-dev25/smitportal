export function getHealth(_request, response) {
  response.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'ok',
      service: 'smitportal-api',
      timestamp: new Date().toISOString(),
    },
  })
}
