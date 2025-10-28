import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const errorRes = exception.getResponse() as any;

    // Crear la respuesta base
    const responseBody = {
      statusCode: status,
      error: errorRes.error || null,
      message: errorRes.message || "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    };

    // Si hay campos adicionales en la respuesta de excepción, incluirlos
    if (typeof errorRes === 'object' && errorRes !== null) {
      Object.keys(errorRes).forEach(key => {
        if (!['error', 'message'].includes(key)) {
          responseBody[key] = errorRes[key];
        }
      });
    }

    response.status(status).json(responseBody);
  }
}
