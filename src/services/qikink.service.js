import { ApiError } from '../utils/ApiError.js';

class QikinkService {
    constructor() {
        this.baseUrl = process.env.QIKINK_BASE_URL || 'https://api.qikink.com';
        this.clientId = process.env.QIKINK_CLIENT_ID;
        this.clientSecret = process.env.QIKINK_CLIENT_SECRET;
    }

    async request(endpoint, options = {}, retries = 3) {
        if (!this.clientId || !this.clientSecret) {
            console.error(
                'Qikink credentials (QIKINK_CLIENT_ID, QIKINK_CLIENT_SECRET) are missing.'
            );
            throw new Error('Missing Qikink API credentials');
        }

        const headers = {
            ClientId: this.clientId,
            Accesstoken: this.clientSecret,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        const config = {
            ...options,
            headers,
        };

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, config);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));

                    if (response.status === 429 || errorData.error?.includes('Rate limit')) {
                        throw new Error(
                            `Qikink Rate Limit Exceeded: ${errorData.error || '30 req/min limit'}`
                        );
                    }

                    throw new Error(
                        `Qikink API Error ${response.status}: ${JSON.stringify(errorData)}`
                    );
                }

                return await response.json();
            } catch (error) {
                console.error(
                    `Qikink API request failed (Attempt ${attempt}/${retries}):`,
                    error.message
                );
                if (attempt === retries) {
                    throw error;
                }

                await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            }
        }
    }

    async placeOrder(orderDoc) {
        const fullName = orderDoc.endCustomerDetails?.name || 'Customer';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        const address = orderDoc.endCustomerDetails?.address || {};

        // Calculate total retail order value charged to customer
        const totalOrderValue = orderDoc.totalPlatformCost + orderDoc.resellerProfitMargin;

        const payload = {
            order_number: orderDoc.orderId,
            qikink_shipping: '1',
            gateway: orderDoc.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
            total_order_value: String(totalOrderValue),
            line_items: orderDoc.items.map((item) => ({
                search_from_my_products: 1,
                sku: item.sku,
                quantity: String(item.qty),
                price: String(item.resellerSellingPrice || item.platformBasePrice),
            })),
            shipping_address: {
                first_name: firstName,
                last_name: lastName || undefined,
                address1: address.street || '',
                address2: '',
                phone: orderDoc.endCustomerDetails?.phone || '',
                email: 'admin@sovely.in',
                city: address.city || '',
                zip: Number(address.zip) || 0, // Must explicitly be numeric per docs
                province: address.state || '',
                country_code: 'IN',
            },
        };

        const response = await this.request('/api/order/create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response || !response.order_id) {
            throw new Error(`Invalid response structure from Qikink: ${JSON.stringify(response)}`);
        }

        return String(response.order_id);
    }

    async syncProduct(product) {
        try {
            const payload = {
                sku: product.sku,
                name: product.title,
                description: product.descriptionHTML || product.title,
                price: product.dropshipBasePrice,
                retail_price: product.suggestedRetailPrice,
                weight: product.weightGrams,
                hsn_code: product.hsnCode,
                status: product.status === 'active' ? 'publish' : 'draft',
                images: product.images?.map((img) => img.url) || [],
            };

            console.log(`Syncing product ${product.sku} to Qikink...`);
            const result = await this.request('/api/products', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            console.log(`Successfully synced product ${product.sku} to Qikink.`);
            return result;
        } catch (error) {
            console.error(`Failed to sync product ${product.sku} to Qikink:`, error.message);
            throw error;
        }
    }

    async updateProduct(product) {
        try {
            const payload = {
                sku: product.sku,
                name: product.title,
                description: product.descriptionHTML || product.title,
                price: product.dropshipBasePrice,
                retail_price: product.suggestedRetailPrice,
                weight: product.weightGrams,
                hsn_code: product.hsnCode,
                status: product.status === 'active' ? 'publish' : 'draft',
                images: product.images?.map((img) => img.url) || [],
            };

            console.log(`Updating product ${product.sku} in Qikink...`);
            const result = await this.request(`/api/products/${product.sku}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            console.log(`Successfully updated product ${product.sku} in Qikink.`);
            return result;
        } catch (error) {
            console.error(`Failed to update product ${product.sku} in Qikink:`, error.message);
            throw error;
        }
    }
}

export const qikinkService = new QikinkService();
