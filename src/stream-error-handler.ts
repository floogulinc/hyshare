import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';

export const handleStreamError: StreamableFile['errorHandler'] = (
  _error,
  response,
) => {
  const res = response as Response;
  if (res.destroyed) {
    return;
  }
  if (res.headersSent) {
    res.destroy();
    return;
  }
  res.statusCode = 500;
  res.removeHeader('Content-Disposition');
  res.removeHeader('Content-Length');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Unable to stream download');
};
