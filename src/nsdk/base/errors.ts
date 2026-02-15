export class BusinessError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, BusinessError.prototype);
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * 服务器内部错误，常用于未知异常且不希望异常明细信息泄露给外部时抛出
 */
export class ServerError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ServerError.prototype);
    }
}