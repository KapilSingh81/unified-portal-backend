const DEFAULTS = { page: 1, limit: 50, maxLimit: 200 };

/**
 * Read and validate page/limit from a request body or query.
 * Returns { page, limit, offset }.
 */
export const getPagination = (source = {}, options = {}) => {
    const { limit: defLimit, maxLimit } = { ...DEFAULTS, ...options };

    const page = Math.max(1, parseInt(source.page, 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(source.limit, 10) || defLimit));

    return { page, limit, offset: (page - 1) * limit };
};

/**
 * Build the pagination object for the response.
 */
export const buildPaginationMeta = ({ page, limit, total }) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
    };
};

/**
 * Paginate an in-memory array.
 * Returns { items, pagination }.
 */
export const paginateArray = (array = [], source = {}, options = {}) => {
    const { page, limit, offset } = getPagination(source, options);
    return {
        items: array.slice(offset, offset + limit),
        pagination: buildPaginationMeta({ page, limit, total: array.length }),
    };
};

/**
 * Paginate a Sequelize model query (uses findAndCountAll).
 * `query` is a normal findAll options object (where, order, attributes, include...).
 * Returns { items, pagination }.
 */
export const paginateModel = async (model, query = {}, source = {}, options = {}) => {
    const { page, limit, offset } = getPagination(source, options);

    const { rows, count } = await model.findAndCountAll({
        ...query,
        limit,
        offset,
        distinct: true, // correct count when using include
    });

    return {
        items: rows,
        pagination: buildPaginationMeta({ page, limit, total: count }),
    };
};