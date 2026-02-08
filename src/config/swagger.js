const spec = {
  openapi: '3.0.0',
    info: {
      title: 'Inventory Management API',
      version: '1.0.0',
      description: 'API for inventory, products, sales, and dashboard',
    },
    servers: [
      { url: 'https://inv-backend-tan.vercel.app', description: 'Production (Vercel)' },
      { url: 'http://localhost:4000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT from login/signup. Use: Bearer &lt;token&gt;',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxx...' },
            name: { type: 'string' },
            sku: { type: 'string', nullable: true },
            barcode: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            unitPrice: { type: 'number' },
            quantityInStock: { type: 'integer' },
            category: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ProductCreate: {
          type: 'object',
          required: ['name', 'unitPrice'],
          properties: {
            name: { type: 'string' },
            sku: { type: 'string' },
            barcode: { type: 'string' },
            description: { type: 'string' },
            unitPrice: { type: 'number', minimum: 0 },
            quantityInStock: { type: 'integer', minimum: 0, default: 0 },
            category: { type: 'string' },
          },
        },
        ProductUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            sku: { type: 'string' },
            barcode: { type: 'string' },
            description: { type: 'string' },
            unitPrice: { type: 'number', minimum: 0 },
            quantityInStock: { type: 'integer', minimum: 0 },
            category: { type: 'string' },
          },
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        SignupRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', maxLength: 64 },
            password: { type: 'string', minLength: 6 },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/AuthUser' },
          },
        },
        SaleItemInput: {
          type: 'object',
          required: ['productId', 'quantity', 'unitPrice'],
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
            unitPrice: { type: 'number', minimum: 0 },
          },
        },
        SaleCreate: {
          type: 'object',
          required: ['items'],
          properties: {
            notes: { type: 'string' },
            items: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/SaleItemInput' },
            },
          },
        },
        Sale: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            totalAmount: { type: 'number' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            items: { type: 'array', items: { $ref: '#/components/schemas/SaleItem' } },
          },
        },
        SaleItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number' },
            subtotal: { type: 'number' },
            product: { $ref: '#/components/schemas/Product' },
          },
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            totalProducts: { type: 'integer' },
            lowStockCount: { type: 'integer' },
            salesToday: { type: 'integer' },
            salesWeek: { type: 'integer' },
            salesMonth: { type: 'integer' },
            revenueToday: { type: 'number' },
            revenueWeek: { type: 'number' },
            revenueMonth: { type: 'number' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Login, signup, current user' },
      { name: 'Products', description: 'Product CRUD and lookup' },
      { name: 'Sales', description: 'Sales and sale items' },
      { name: 'Dashboard', description: 'Summary and reports' },
    ],
    paths: {
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Current user', content: { 'application/json': { schema: { properties: { id: {}, username: {} } } } } },
            401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/signup': {
        post: {
          tags: ['Auth'],
          summary: 'Register new admin',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } } },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            409: { description: 'Username already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'List all products',
          responses: {
            200: { description: 'List of products', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } },
          },
        },
        post: {
          tags: ['Products'],
          summary: 'Create product',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductCreate' } } } },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/products/by-barcode/{barcode}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by barcode',
          parameters: [{ name: 'barcode', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        put: {
          tags: ['Products'],
          summary: 'Update product (full/partial)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductUpdate' } } } },
          responses: {
            200: { description: 'Updated product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        patch: {
          tags: ['Products'],
          summary: 'Update stock quantity only',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['quantityInStock'], properties: { quantityInStock: { type: 'integer', minimum: 0 } } } } } },
          responses: {
            200: { description: 'Updated product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete product',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'No content' },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/sales': {
        get: {
          tags: ['Sales'],
          summary: 'List all sales',
          responses: {
            200: { description: 'List of sales with items', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Sale' } } } } },
          },
        },
        post: {
          tags: ['Sales'],
          summary: 'Create sale',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/SaleCreate' } } } },
          responses: {
            201: { description: 'Created sale', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sale' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/sales/{id}': {
        get: {
          tags: ['Sales'],
          summary: 'Get sale by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Sale with items', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sale' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/dashboard/summary': {
        get: {
          tags: ['Dashboard'],
          summary: 'Dashboard summary (counts and revenue)',
          responses: {
            200: { description: 'Summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardSummary' } } } },
          },
        },
      },
      '/api/dashboard/sales-over-time': {
        get: {
          tags: ['Dashboard'],
          summary: 'Sales over time (for charts)',
          parameters: [
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Start date (default: 30 days ago)' },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'End date (default: now)' },
          ],
          responses: {
            200: { description: 'Array of { id, createdAt, totalAmount }', content: { 'application/json': { schema: { type: 'array' } } } },
          },
        },
      },
      '/api/dashboard/reports/sales': {
        get: {
          tags: ['Dashboard'],
          summary: 'Sales report with optional date range',
          parameters: [
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          ],
          responses: {
            200: {
              description: 'Report with totalRevenue, totalTransactions, sales',
              content: { 'application/json': { schema: { type: 'object', properties: { totalRevenue: {}, totalTransactions: {}, sales: { type: 'array' } } } } },
            },
          },
        },
      },
    },
};

export default spec;
