class ResponseService {
    static success(res, message = 'Success', data = null, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static created(res, message = 'Created', data = null) {
        return this.success(res, data, message, 201);
    }

    static error(
        res,
        message = 'Internal Server Error',
        errors = null,
        statusCode = 500
    ) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors: errors ?? statusCode
        });
    }

    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, null, 401);
    }

    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, null, 403);
    }

    static notFound(res, message = 'Not Found') {
        return this.error(res, message, null, 404);
    }

    static conflict(res, message = 'Conflict') {
        return this.error(res, message, null, 409);
    }

    static badRequest(res, message = 'Bad Request', errors = null) {
        return this.error(res, message, errors, 400);
    }

    static unprocessable(res, message = 'Unprocessable Entity', errors = null) {
        return this.error(res, message, errors, 422);
    }

    static tooManyRequests(res, message = 'Too Many Requests') {
        return this.error(res, message, null, 429);
    }

    static internal(res, message = 'Internal Server Error') {
        return this.error(res, message, null, 500);
    }

    static notImplemented(res, message = 'Not Implemented') {
        return this.error(res, message, null, 501);
    }

    static badGateway(res, message = 'Bad Gateway') {
        return this.error(res, message, null, 502);
    }

    static serviceUnavailable(res, message = 'Service Unavailable') {
        return this.error(res, message, null, 503);
    }

    static gatewayTimeout(res, message = 'Gateway Timeout') {
        return this.error(res, message, null, 504);
    }
}

export default ResponseService;